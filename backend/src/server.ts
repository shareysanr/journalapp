import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import {
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  SignUpCommand
} from "@aws-sdk/client-cognito-identity-provider";
import {
  accessTokenVerifier,
  cognitoClient,
  cognitoEnv,
  computeSecretHash
} from "./config/cognito";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        sub: string;
        username?: string;
        client_id?: string;
      };
    }
  }
}

const app = express();

app.use(cors());
app.use(express.json());

function cognitoErrorStatus(err: unknown): number {
  if (err && typeof err === "object" && "name" in err) {
    const name = (err as { name: string }).name;
    if (name === "UsernameExistsException") return 409;
    if (name === "NotAuthorizedException" || name === "UserNotConfirmedException") return 401;
  }
  return 400;
}

function cognitoErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "name" in err) {
    const name = (err as { name: string }).name;
    const msg =
      "message" in err && typeof (err as { message?: string }).message === "string"
        ? (err as { message: string }).message
        : "";
    if (name === "NotAuthorizedException") return "Incorrect username or password.";
    if (name === "UserNotConfirmedException") return "User is not confirmed.";
    if (name === "UsernameExistsException") return "User already exists.";
    if (name === "InvalidPasswordException") return msg || "Invalid password.";
    if (name === "CodeMismatchException") return "Invalid confirmation code.";
    if (name === "ExpiredCodeException") return "Confirmation code expired.";
    return msg || name;
  }
  return "Request failed.";
}

async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: { message: "Unauthorized" } });
  }
  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    return res.status(401).json({ error: { message: "Unauthorized" } });
  }
  try {
    const payload = await accessTokenVerifier.verify(token);
    req.auth = {
      sub: payload.sub,
      username: typeof payload.username === "string" ? payload.username : undefined,
      client_id: typeof payload.client_id === "string" ? payload.client_id : undefined
    };
    next();
  } catch {
    return res.status(401).json({ error: { message: "Unauthorized" } });
  }
}

type Entry = {
  id: number;
  date: string; // Keep as string not Date object, as JSON will send dates as strings anyways
  goalsPlanned: string;
  numGoals: number;
  goalsCompleted: number;
  distractions: string[]; // Change to enum later
  negativeComponents: string[]; // Change to enum later
  positiveComponents: string[]; // Change to enum later
  difficulty: number;
  rating: number;
  notes: string;
};

let entries: Entry[] = [];
let nextId = 1;

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Backend is running" });
});

// Entries API
app.post("/api/v1/entries", requireAuth, (req: Request, res: Response) => {
  const {
    goalsPlanned,
    numGoals,
    goalsCompleted,
    distractions,
    negativeComponents,
    positiveComponents,
    difficulty,
    rating,
    notes
  } = req.body;

  const entry: Entry = {
    id: nextId++,
    date: new Date().toISOString().split("T")[0],
    goalsPlanned,
    numGoals,
    goalsCompleted,
    distractions,
    negativeComponents,
    positiveComponents,
    difficulty,
    rating,
    notes
  };

  entries.push(entry);

  res.status(201).json({ data: entry });
});

app.get("/api/v1/entries/:entryId", requireAuth, (req: Request, res: Response) => {
  const entryId = Number(req.params.entryId);
  const entry = entries.find((e) => e.id === entryId);

  if (!entry) {
    return res.status(404).json({
      error: { message: "Entry not found" }
    });
  }

  res.json({ data: entry });
});

app.put("/api/v1/entries/:entryId", requireAuth, (req: Request, res: Response) => {
  const entryId = Number(req.params.entryId);
  const index = entries.findIndex((e) => e.id === entryId);

  if (index === -1) {
    return res.status(404).json({
      error: { message: "Entry not found" }
    });
  }

  const {
    goalsPlanned,
    numGoals,
    goalsCompleted,
    distractions,
    negativeComponents,
    positiveComponents,
    difficulty,
    rating,
    notes
  } = req.body;

  const updatedEntry: Entry = {
    id: entryId,
    date: entries[index].date,
    goalsPlanned,
    numGoals,
    goalsCompleted,
    distractions,
    negativeComponents,
    positiveComponents,
    difficulty,
    rating,
    notes
  };

  entries[index] = updatedEntry;

  res.json({ data: updatedEntry });
});

app.delete("/api/v1/entries/:entryId", requireAuth, (req: Request, res: Response) => {
  const entryId = Number(req.params.entryId);
  const index = entries.findIndex((e) => e.id === entryId);

  if (index === -1) {
    return res.status(404).json({
      error: { message: "Entry not found" }
    });
  }

  entries.splice(index, 1);

  res.json({
    data: { result: "success" }
  });
});

// Weekly reports API
// Place holder entries so far
app.get("/api/v1/weekly-reports/:reportId", requireAuth, (req: Request, res: Response) => {
  const reportId = Number(req.params.reportId);

  res.json({
    data: {
      id: reportId,
      weekStartDate: "2026-05-04",
      weekEndDate: "2026-05-10",
      summary: "Placeholder weekly report summary.",
      commonDistractions: [],
      commonNegativeComponents: [],
      commonPositiveComponents: [],
      accomplishments: 0,
      failures: 0,
      recommendations: "Placeholder recommendation.",
      averageRating: 0,
      entryIds: []
    }
  });
});

app.post("/api/v1/weekly-reports", requireAuth, (req: Request, res: Response) => {
  res.status(201).json({
    data: {
      id: 1,
      weekStartDate: req.body.weekStartDate,
      weekEndDate: req.body.weekEndDate,
      summary: "Generated placeholder weekly report.",
      commonDistractions: [],
      commonNegativeComponents: [],
      commonPositiveComponents: [],
      accomplishments: 0,
      failures: 0,
      recommendations: "Placeholder recommendation.",
      averageRating: 0,
      entryIds: []
    }
  });
});

// Sign up / login API
app.post("/api/v1/signup", async (req: Request, res: Response) => {
  const username = req.body.username ?? req.body.email;
  const password = req.body.password;
  if (!username || !password) {
    return res.status(400).json({
      error: { message: "username (or email) and password are required" }
    });
  }

  const usernameStr = String(username);
  const passwordStr = String(password);

  const userAttributes: { Name: string; Value: string }[] = [];
  if (req.body.email !== undefined) {
    userAttributes.push({ Name: "email", Value: String(req.body.email) });
  } else if (usernameStr.includes("@")) {
    userAttributes.push({ Name: "email", Value: usernameStr });
  }

  try {
    const out = await cognitoClient.send(
      new SignUpCommand({
        ClientId: cognitoEnv.clientId,
        Username: usernameStr,
        Password: passwordStr,
        SecretHash: computeSecretHash(usernameStr),
        ...(userAttributes.length > 0 ? { UserAttributes: userAttributes } : {})
      })
    );

    res.status(201).json({
      data: {
        userSub: out.UserSub,
        codeDeliveryDetails: out.CodeDeliveryDetails,
        userConfirmed: out.UserConfirmed
      }
    });
  } catch (err) {
    res.status(cognitoErrorStatus(err)).json({
      error: { message: cognitoErrorMessage(err) }
    });
  }
});

app.post("/api/v1/confirm-signup", async (req: Request, res: Response) => {
  const username = req.body.username ?? req.body.email;
  const confirmationCode = req.body.confirmationCode ?? req.body.code;
  if (!username || !confirmationCode) {
    return res.status(400).json({
      error: { message: "username (or email) and confirmationCode are required" }
    });
  }

  const usernameStr = String(username);

  try {
    await cognitoClient.send(
      new ConfirmSignUpCommand({
        ClientId: cognitoEnv.clientId,
        Username: usernameStr,
        ConfirmationCode: String(confirmationCode),
        SecretHash: computeSecretHash(usernameStr)
      })
    );

    res.json({ data: { confirmed: true } });
  } catch (err) {
    res.status(cognitoErrorStatus(err)).json({
      error: { message: cognitoErrorMessage(err) }
    });
  }
});

app.post("/api/v1/login", async (req: Request, res: Response) => {
  const username = req.body.username ?? req.body.email;
  const password = req.body.password;
  if (!username || !password) {
    return res.status(400).json({
      error: { message: "username (or email) and password are required" }
    });
  }

  const usernameStr = String(username);

  try {
    const out = await cognitoClient.send(
      new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: cognitoEnv.clientId,
        AuthParameters: {
          USERNAME: usernameStr,
          PASSWORD: String(password),
          SECRET_HASH: computeSecretHash(usernameStr)
        }
      })
    );

    if (out.AuthenticationResult) {
      return res.json({
        data: {
          accessToken: out.AuthenticationResult.AccessToken,
          idToken: out.AuthenticationResult.IdToken,
          refreshToken: out.AuthenticationResult.RefreshToken,
          expiresIn: out.AuthenticationResult.ExpiresIn,
          tokenType: out.AuthenticationResult.TokenType
        }
      });
    }

    if (out.ChallengeName) {
      return res.status(200).json({
        data: {
          challengeName: out.ChallengeName,
          challengeParameters: out.ChallengeParameters,
          session: out.Session
        }
      });
    }

    res.status(400).json({ error: { message: "Unexpected login response" } });
  } catch (err) {
    res.status(cognitoErrorStatus(err)).json({
      error: { message: cognitoErrorMessage(err) }
    });
  }
});

app.get("/api/v1/me", requireAuth, (req: Request, res: Response) => {
  res.json({
    data: {
      sub: req.auth?.sub,
      username: req.auth?.username
    }
  });
});

// Port information
const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

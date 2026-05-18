import { Request, Response, Router } from "express";
import {
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  SignUpCommand
} from "@aws-sdk/client-cognito-identity-provider";
import { cognitoClient, cognitoEnv, computeSecretHash } from "../config/cognito";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

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

router.post("/api/v1/signup", async (req: Request, res: Response) => {
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

router.post("/api/v1/confirm-signup", async (req: Request, res: Response) => {
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

router.post("/api/v1/login", async (req: Request, res: Response) => {
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

router.get("/api/v1/me", requireAuth, (req: Request, res: Response) => {
  res.json({
    data: {
      sub: req.auth?.sub,
      username: req.auth?.username
    }
  });
});

export default router;

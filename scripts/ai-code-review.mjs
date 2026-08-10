/**
 * AI PR code review — runs in GitHub Actions on pull_request.
 * Requires: OPENAI_API_KEY, GITHUB_TOKEN, PR_NUMBER, BASE_SHA, HEAD_SHA, REPO
 */

const REVIEW_MARKER = "<!-- ai-code-review -->";
const MAX_DIFF_BYTES = 100_000;
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

const IGNORE_PATTERNS = [
  /^package-lock\.json$/,
  /^backend\/package-lock\.json$/,
  /^frontend\/package-lock\.json$/,
  /^node_modules\//,
  /(^|\/)node_modules\//,
  /(^|\/)dist\//,
  /(^|\/)coverage\//,
  /^backend\/src\/generated\//,
  /(^|\/)backend\/src\/generated\//,
  /\.(png|jpe?g|gif|webp|ico|pdf|zip|wasm|svg)$/i,
  /\.(html|css\.map|js\.map)$/i
];

const SYSTEM_PROMPT = `You are a senior engineer reviewing a pull request diff for a TypeScript monorepo (Express backend, React frontend).

Review ONLY what appears in the diff. Do not claim you ran tests, built the project, or executed code.

Focus on:
- Likely bugs and logic errors
- Security risks (auth, secrets, injection, unsafe defaults)
- TypeScript/runtime error risks
- Broken assumptions or missing edge cases
- Missing or inadequate tests for risky changes
- Risky backend, database, auth, queue/worker, or CI/deployment changes

Avoid:
- Nitpicky style or formatting comments
- Restating the entire diff
- Comments about generated files, lockfiles, coverage artifacts, or binaries
- Absolute certainty when you are inferring

Output format (markdown, keep concise — under ~400 words):
## Summary
1-3 sentences on overall risk/quality.

## Findings
- Use bullet points. Prefix each with severity: **High**, **Medium**, or **Low**.
- If nothing substantive, write: "No significant issues identified from the diff alone."

## Suggested follow-ups
- Optional bullets for tests or manual checks. Omit if none.`;

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function shouldIgnorePath(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  return IGNORE_PATTERNS.some((pattern) => pattern.test(normalized));
}

function parseDiffFiles(rawDiff) {
  const files = [];
  const chunks = rawDiff.split(/^diff --git /m).filter(Boolean);

  for (const chunk of chunks) {
    const headerLine = chunk.split("\n")[0] ?? "";
    const match = headerLine.match(/^a\/(.+?) b\/(.+)$/);
    if (!match) {
      continue;
    }
    const path = match[2];
    const body = `diff --git ${chunk}`.trimEnd();
    files.push({ path, body });
  }

  return files;
}

function filterDiff(rawDiff) {
  if (!rawDiff.trim()) {
    return { filteredDiff: "", includedPaths: [], excludedPaths: [], binaryOnly: false };
  }

  const files = parseDiffFiles(rawDiff);
  const included = [];
  const excluded = [];

  for (const file of files) {
    if (shouldIgnorePath(file.path)) {
      excluded.push(file.path);
      continue;
    }
    if (/^Binary files /m.test(file.body) || /GIT binary patch/m.test(file.body)) {
      excluded.push(file.path);
      continue;
    }
    included.push(file);
  }

  const filteredDiff = included.map((f) => f.body).join("\n\n");
  return {
    filteredDiff,
    includedPaths: included.map((f) => f.path),
    excludedPaths: excluded,
    binaryOnly: included.length === 0 && files.length > 0
  };
}

async function githubRequest(path, { method = "GET", body } = {}) {
  const token = requiredEnv("GITHUB_TOKEN");
  const response = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(body ? { "Content-Type": "application/json" } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API ${method} ${path} failed (${response.status}): ${text}`);
  }

  if (response.status === 204) {
    return null;
  }
  return response.json();
}

async function findExistingReviewComment(owner, repo, prNumber) {
  const comments = await githubRequest(`/repos/${owner}/${repo}/issues/${prNumber}/comments`);
  return comments.find((comment) => comment.body?.includes(REVIEW_MARKER)) ?? null;
}

async function upsertReviewComment(owner, repo, prNumber, body) {
  const existing = await findExistingReviewComment(owner, repo, prNumber);
  if (existing) {
    return githubRequest(`/repos/${owner}/${repo}/issues/comments/${existing.id}`, {
      method: "PATCH",
      body: { body }
    });
  }
  return githubRequest(`/repos/${owner}/${repo}/issues/${prNumber}/comments`, {
    method: "POST",
    body: { body }
  });
}

function buildCommentBody({ reviewText, meta }) {
  const footer = `\n\n---\n*Automated review from diff only. Did not run tests or execute code.*`;
  const metaLine = meta ? `\n\n<details><summary>Review metadata</summary>\n\n${meta}\n</details>` : "";
  return `${REVIEW_MARKER}\n## AI code review\n\n${reviewText}${metaLine}${footer}`;
}

async function requestOpenAiReview(diff) {
  const apiKey = process.env.OPENAI_API_KEY;
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Review this pull request diff:\n\n\`\`\`diff\n${diff}\n\`\`\``
        }
      ]
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI API failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("OpenAI returned an empty review.");
  }
  return content;
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.log(
      "OPENAI_API_KEY is not available. Skipping AI review (expected for forked pull requests)."
    );
    process.exit(0);
  }

  const prNumber = requiredEnv("PR_NUMBER");
  const baseSha = requiredEnv("BASE_SHA");
  const headSha = requiredEnv("HEAD_SHA");
  const repoFull = requiredEnv("REPO");
  const [owner, repo] = repoFull.split("/");
  if (!owner || !repo) {
    throw new Error(`Invalid REPO format: ${repoFull}`);
  }

  const { execFileSync } = await import("node:child_process");
  const rawDiff = execFileSync("git", ["diff", "--unified=3", `${baseSha}...${headSha}`], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024
  });

  const { filteredDiff, includedPaths, excludedPaths } = filterDiff(rawDiff);

  if (!filteredDiff.trim()) {
    const skipBody = buildCommentBody({
      reviewText:
        "No reviewable source changes after filtering generated artifacts, lockfiles, binaries, and coverage output.",
      meta: excludedPaths.length
        ? `Excluded paths (${excludedPaths.length}): ${excludedPaths.slice(0, 20).join(", ")}${excludedPaths.length > 20 ? ", …" : ""}`
        : "No changed files in diff."
    });
    await upsertReviewComment(owner, repo, prNumber, skipBody);
    console.log("Skipped AI review: filtered diff is empty.");
    process.exit(0);
  }

  const diffBytes = Buffer.byteLength(filteredDiff, "utf8");
  if (diffBytes > MAX_DIFF_BYTES) {
    const skipBody = buildCommentBody({
      reviewText: `Diff too large for automated review (${Math.round(diffBytes / 1024)} KB; limit ${Math.round(MAX_DIFF_BYTES / 1024)} KB). Please review manually or split the PR.`,
      meta: `Included ${includedPaths.length} file(s): ${includedPaths.slice(0, 15).join(", ")}${includedPaths.length > 15 ? ", …" : ""}`
    });
    await upsertReviewComment(owner, repo, prNumber, skipBody);
    console.log(`Skipped AI review: diff exceeds ${MAX_DIFF_BYTES} bytes.`);
    process.exit(0);
  }

  console.log(
    `Reviewing ${includedPaths.length} file(s), ${Math.round(diffBytes / 1024)} KB (excluded ${excludedPaths.length}).`
  );

  const reviewText = await requestOpenAiReview(filteredDiff);
  const meta = [
    `Model: ${OPENAI_MODEL}`,
    `Files reviewed: ${includedPaths.length}`,
    includedPaths.length
      ? `Paths: ${includedPaths.slice(0, 20).join(", ")}${includedPaths.length > 20 ? ", …" : ""}`
      : null
  ]
    .filter(Boolean)
    .join("\n");

  await upsertReviewComment(
    owner,
    repo,
    prNumber,
    buildCommentBody({ reviewText, meta })
  );
  console.log("Posted updated AI review comment.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

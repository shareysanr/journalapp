import { createHmac } from "crypto";
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import { CognitoJwtVerifier } from "aws-jwt-verify";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const region = process.env.COGNITO_REGION ?? process.env.AWS_REGION;
if (!region) {
  throw new Error("Set COGNITO_REGION or AWS_REGION for the Cognito API client.");
}

export const cognitoEnv = {
  region,
  userPoolId: requireEnv("COGNITO_USER_POOL_ID"),
  clientId: requireEnv("COGNITO_CLIENT_ID"),
  clientSecret: requireEnv("COGNITO_CLIENT_SECRET")
};

export function computeSecretHash(username: string): string {
  return createHmac("sha256", cognitoEnv.clientSecret)
    .update(username + cognitoEnv.clientId)
    .digest("base64");
}

export const cognitoClient = new CognitoIdentityProviderClient({
  region: cognitoEnv.region
});

export const accessTokenVerifier = CognitoJwtVerifier.create({
  userPoolId: cognitoEnv.userPoolId,
  tokenUse: "access",
  clientId: cognitoEnv.clientId
});

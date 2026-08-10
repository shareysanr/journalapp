import { describe, expect, it } from "vitest";
import { cognitoErrorMessage, cognitoErrorStatus } from "../src/utils/cognitoErrors";

describe("cognitoErrorStatus", () => {
  it("maps known Cognito errors to HTTP statuses", () => {
    expect(cognitoErrorStatus({ name: "UsernameExistsException" })).toBe(409);
    expect(cognitoErrorStatus({ name: "NotAuthorizedException" })).toBe(401);
    expect(cognitoErrorStatus({ name: "UserNotConfirmedException" })).toBe(401);
  });

  it("defaults to 400 for unknown or non-object errors", () => {
    expect(cognitoErrorStatus({ name: "SomethingElse" })).toBe(400);
    expect(cognitoErrorStatus("boom")).toBe(400);
    expect(cognitoErrorStatus(null)).toBe(400);
  });
});

describe("cognitoErrorMessage", () => {
  it("maps known Cognito errors to friendly messages", () => {
    expect(cognitoErrorMessage({ name: "NotAuthorizedException" })).toBe(
      "Incorrect username or password."
    );
    expect(cognitoErrorMessage({ name: "UserNotConfirmedException" })).toBe(
      "User is not confirmed."
    );
    expect(cognitoErrorMessage({ name: "UsernameExistsException" })).toBe("User already exists.");
    expect(cognitoErrorMessage({ name: "CodeMismatchException" })).toBe(
      "Invalid confirmation code."
    );
    expect(cognitoErrorMessage({ name: "ExpiredCodeException" })).toBe(
      "Confirmation code expired."
    );
  });

  it("uses Cognito message for InvalidPasswordException when present", () => {
    expect(
      cognitoErrorMessage({ name: "InvalidPasswordException", message: "Too short" })
    ).toBe("Too short");
    expect(cognitoErrorMessage({ name: "InvalidPasswordException" })).toBe("Invalid password.");
  });

  it("falls back to message, name, or generic text", () => {
    expect(cognitoErrorMessage({ name: "CustomError", message: "Nope" })).toBe("Nope");
    expect(cognitoErrorMessage({ name: "CustomError" })).toBe("CustomError");
    expect(cognitoErrorMessage(null)).toBe("Request failed.");
  });
});

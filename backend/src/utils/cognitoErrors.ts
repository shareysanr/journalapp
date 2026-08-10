export function cognitoErrorStatus(err: unknown): number {
  if (err && typeof err === "object" && "name" in err) {
    const name = (err as { name: string }).name;
    if (name === "UsernameExistsException") return 409;
    if (name === "NotAuthorizedException" || name === "UserNotConfirmedException") return 401;
  }
  return 400;
}

export function cognitoErrorMessage(err: unknown): string {
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

import { useState, type FormEvent } from "react";
import { apiRequest } from "../api";

type Props = {
  onLoggedIn: (accessToken: string) => void;
};

export default function LoginPage({ onLoggedIn }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await apiRequest<{ data: { accessToken: string } }>(
        "/api/v1/login",
        {
          method: "POST",
          body: JSON.stringify({ username, password })
        }
      );

      onLoggedIn(response.data.accessToken);
      setSuccess("Logged in successfully.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>Login</h2>

      {error && <div className="message error">{error}</div>}
      {success && <div className="message success">{success}</div>}

      <form onSubmit={handleLogin}>
        <label>
          Username or email
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>
    </div>
  );
}


import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiRequest } from "../api";

export default function ConfirmSignupPage() {
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState(searchParams.get("username") ?? "");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleConfirm(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiRequest("/api/v1/confirm-signup", {
        method: "POST",
        body: JSON.stringify({ username, confirmationCode })
      });

      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Confirmation failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Confirm your account</h1>
        <p className="mt-1 text-sm text-slate-600">
          Enter the confirmation code sent to your email.
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {success ? (
          <div className="mt-6">
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              Account confirmed. You can now log in.
            </div>
            <Link
              to="/login"
              className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Go to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleConfirm} className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Username or email
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="rounded-lg border border-slate-300 px-3 py-2 text-base font-normal focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Confirmation code
              <input
                type="text"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                required
                className="rounded-lg border border-slate-300 px-3 py-2 text-base font-normal focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-slate-400"
            >
              {loading ? "Confirming..." : "Confirm account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

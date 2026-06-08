import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  success?: string | null;
  error?: string | null;
};

export default function Layout({ children, success, error }: Props) {
  return (
    <div className="app">
      <header>
        <h1>Journal App</h1>
      </header>

      {error && <div className="message error">{error}</div>}
      {success && <div className="message success">{success}</div>}

      {children}
    </div>
  );
}


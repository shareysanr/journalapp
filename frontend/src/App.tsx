import { useState } from "react";
import { clearAccessToken, getAccessToken, setAccessToken } from "./api";
import Layout from "./components/Layout";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import NewEntryPage from "./pages/NewEntryPage";
import ReportsPage from "./pages/ReportsPage";
import "./App.css";

type Route = "dashboard" | "new-entry" | "reports";

export default function App() {
  const [accessToken, setAccessTokenState] = useState<string | null>(() => getAccessToken());
  const [route, setRoute] = useState<Route>("dashboard");

  function handleLoggedIn(token: string) {
    setAccessToken(token);
    setAccessTokenState(token);
    setRoute("dashboard");
  }

  function handleLogout() {
    clearAccessToken();
    setAccessTokenState(null);
    setRoute("dashboard");
  }

  if (!accessToken) {
    return (
      <Layout>
        <LoginPage onLoggedIn={handleLoggedIn} />
      </Layout>
    );
  }

  return (
    <Layout>
      <Navbar route={route} onNavigate={setRoute} onLogout={handleLogout} />

      {route === "dashboard" && <DashboardPage />}
      {route === "new-entry" && <NewEntryPage />}
      {route === "reports" && <ReportsPage />}
    </Layout>
  );
}

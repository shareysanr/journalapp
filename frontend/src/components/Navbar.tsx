type Route = "dashboard" | "new-entry" | "reports";

type Props = {
  route: Route;
  onNavigate: (route: Route) => void;
  onLogout: () => void;
};

export default function Navbar({ route, onNavigate, onLogout }: Props) {
  return (
    <div className="navbar">
      <button
        type="button"
        className={route === "dashboard" ? "nav-button active" : "nav-button"}
        onClick={() => onNavigate("dashboard")}
      >
        Dashboard
      </button>
      <button
        type="button"
        className={route === "new-entry" ? "nav-button active" : "nav-button"}
        onClick={() => onNavigate("new-entry")}
      >
        New Entry
      </button>
      <button
        type="button"
        className={route === "reports" ? "nav-button active" : "nav-button"}
        onClick={() => onNavigate("reports")}
      >
        Reports
      </button>
      <button type="button" className="nav-button" onClick={onLogout}>
        Log out
      </button>
    </div>
  );
}


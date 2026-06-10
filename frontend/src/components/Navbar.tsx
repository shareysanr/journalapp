import { NavLink, useNavigate } from "react-router-dom";
import { clearAccessToken } from "../api";

function navLinkClass({ isActive }: { isActive: boolean }) {
  return isActive
    ? "rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white"
    : "rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900";
}

export default function Navbar() {
  const navigate = useNavigate();

  function handleLogout() {
    clearAccessToken();
    navigate("/");
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <NavLink to="/dashboard" className="text-lg font-semibold text-slate-900">
          Clarity
        </NavLink>

        <nav className="flex flex-wrap items-center gap-1">
          <NavLink to="/dashboard" className={navLinkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/entries/new" className={navLinkClass}>
            New Entry
          </NavLink>
          <NavLink to="/entries" end className={navLinkClass}>
            View Entries
          </NavLink>
          <NavLink to="/reports" end className={navLinkClass}>
            Preview Report
          </NavLink>
          <NavLink to="/reports/view" className={navLinkClass}>
            View Report
          </NavLink>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            Log out
          </button>
        </nav>
      </div>
    </header>
  );
}

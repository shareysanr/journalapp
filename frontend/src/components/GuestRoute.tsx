import { Navigate, Outlet } from "react-router-dom";
import { getAccessToken } from "../api";

export default function GuestRoute() {
  if (getAccessToken()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

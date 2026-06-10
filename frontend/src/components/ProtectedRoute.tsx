import { Navigate, Outlet } from "react-router-dom";
import { getAccessToken } from "../api";

export default function ProtectedRoute() {
  if (!getAccessToken()) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

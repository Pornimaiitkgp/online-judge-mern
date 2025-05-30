// frontend/src/components/PrivateRoute.jsx

import { useSelector } from "react-redux";
import { Outlet, Navigate } from "react-router-dom";

export default function PrivateRoute() {
  const { currentUser } = useSelector((state) => state.user);

  // This checks if ANY user is logged in
  return currentUser ? <Outlet /> : <Navigate to="/signin" />;
}
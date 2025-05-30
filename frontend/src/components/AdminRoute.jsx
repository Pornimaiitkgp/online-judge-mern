// frontend/src/components/AdminRoute.jsx

import { useSelector } from "react-redux";
import { Outlet, Navigate } from "react-router-dom";

export default function AdminRoute() {
  const { currentUser } = useSelector((state) => state.user);

  // --- ADD THESE CONSOLE LOGS ---
  console.log("AdminRoute rendered:");
  console.log("currentUser:", currentUser);
  console.log("currentUser && currentUser.isAdmin:", currentUser && currentUser.isAdmin);
  // --- END CONSOLE LOGS ---

  if (currentUser && currentUser.isAdmin) {
    console.log("AdminRoute: Access GRANTED - rendering Outlet."); // Log for success
    return <Outlet />;
  } else {
    console.log("AdminRoute: Access DENIED - redirecting to /signin."); // Log for denial
    return <Navigate to="/signin" />;
  }
}
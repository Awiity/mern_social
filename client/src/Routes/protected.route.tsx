import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../Context/auth.context";

type Props = { children: React.ReactNode };

const ProtectedRoute = ({ children }: Props) => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? (
    <>{children}</>
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
};

export default ProtectedRoute;
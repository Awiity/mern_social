import { Navigate } from "react-router";
import { useAuth } from "../Context/auth.context";
import { JSX } from "react";

export function ProtectedRoute({ children }: { children: JSX.Element }) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    return children;
}
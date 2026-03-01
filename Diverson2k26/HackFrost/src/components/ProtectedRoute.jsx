import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageSkeleton } from './SkeletonLoader';

/**
 * Route guard wrapper.
 * - requireAuth: user must be logged in
 * - allowedRoles: optional array of allowed user roles (e.g. ['manufacturer', 'customer'])
 * - redirectTo: path to redirect when denied (default: login page)
 */
export default function ProtectedRoute({ children, requireAuth = true, allowedRoles, redirectTo }) {
    const { user, loading, isAuthenticated } = useAuth();

    if (loading) return <PageSkeleton />;

    if (requireAuth && !isAuthenticated) {
        return <Navigate to={redirectTo || '/home'} replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return <Navigate to={redirectTo || '/home'} replace />;
    }

    return children;
}

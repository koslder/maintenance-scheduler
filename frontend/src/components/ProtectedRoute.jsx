import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ role }) => {
    const token = localStorage.getItem('token');

    if (!token) {
        // Redirect to login if no token
        return <Navigate to="/login" />;
    }

    const decodedToken = JSON.parse(atob(token.split('.')[1]));

    // Check if user has the required role
    if (decodedToken.role !== role) {
        alert('Access denied!');
        return <Navigate to="/dashboard" />;
    }

    // Render the component if the role matches
    return <Outlet />;
};

export default ProtectedRoute;

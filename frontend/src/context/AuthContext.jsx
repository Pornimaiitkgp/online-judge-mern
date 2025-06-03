// online_judge/frontend/src/context/AuthContext.js

import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection
import axios from 'axios'; // Import axios for logout, or if you handle login here

// 1. Create the Context
const AuthContext = createContext();

// 2. Create a Provider Component
export const AuthProvider = ({ children }) => {
    // Initialize user and token state from localStorage if they exist
    // This allows user to remain logged in on page refresh
    const [user, setUser] = useState(() => {
        try {
            const storedUser = localStorage.getItem('user');
            return storedUser ? JSON.parse(storedUser) : null;
        } catch (error) {
            console.error("Failed to parse user from localStorage:", error);
            return null;
        }
    });

    const [token, setToken] = useState(() => localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true); // To manage initial loading state

    const navigate = useNavigate(); // Hook for programmatic navigation

    // Set axios default header for all requests
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
        setLoading(false); // Authentication state loaded
    }, [token]);

    // Function to handle user login
    const login = (userData, userToken) => {
        setUser(userData);
        setToken(userToken);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', userToken);
        // axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`; // Already handled by useEffect
    };

    // Function to handle user logout
    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        // delete axios.defaults.headers.common['Authorization']; // Already handled by useEffect
        navigate('/signin'); // Redirect to login page after logout
    };

    // You might want to add a function to refresh the token or verify session
    // For simplicity, we'll rely on backend middleware to invalidate old tokens

    // The value provided to consumers of this context
    const contextValue = {
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!user // Convenience property
    };

    if (loading) {
        return <div>Loading authentication...</div>; // Or a spinner/loading indicator
    }

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// 3. Export the Context for consumption
export default AuthContext;
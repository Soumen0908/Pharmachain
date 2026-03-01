import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Check for existing session on mount
    useEffect(() => {
        const token = api.getToken();
        if (token) {
            api.getMe()
                .then(data => setUser(data.user))
                .catch(() => {
                    api.clearToken();
                    setUser(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const signup = useCallback(async (userData) => {
        setError('');
        try {
            const data = await api.signup(userData);
            setUser(data.user);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    const login = useCallback(async (email, password, role) => {
        setError('');
        try {
            const data = await api.login(email, password, role);
            // Two-step login: if requireOTP, don't set user yet
            if (data.requireOTP) return data;
            setUser(data.user);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    const loginVerify = useCallback(async (email, otp, role) => {
        setError('');
        try {
            const data = await api.loginVerify(email, otp, role);
            setUser(data.user);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    const logout = useCallback(async () => {
        await api.logout();
        setUser(null);
    }, []);

    const updateProfile = useCallback(async (updates) => {
        const data = await api.updateProfile(updates);
        setUser(data.user);
        return data;
    }, []);

    const verifyGovtId = useCallback(async () => {
        const data = await api.verifyGovtId();
        setUser(data.user);
        return data;
    }, []);

    const refreshUser = useCallback(async () => {
        try {
            const data = await api.getMe();
            setUser(data.user);
        } catch { }
    }, []);

    const value = {
        user,
        loading,
        error,
        isAuthenticated: !!user,
        isCustomer: user?.role === 'customer',
        isManufacturer: user?.role === 'manufacturer',
        signup,
        login,
        loginVerify,
        logout,
        updateProfile,
        verifyGovtId,
        refreshUser,
        setError,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}

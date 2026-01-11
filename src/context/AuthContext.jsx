import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        // Determine if we are in Electron or Web (Mock)
        if (window.api) {
            const result = await window.api.login({ username, password });
            if (result) {
                setUser(result);
                localStorage.setItem('user', JSON.stringify(result));
                return true;
            }
        } else {
            // Mock login for browser dev
            if (username === 'admin' && password === 'admin') {
                const mockUser = { username: 'admin', role: 'owner' };
                setUser(mockUser);
                localStorage.setItem('user', JSON.stringify(mockUser));
                return true;
            }
        }
        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

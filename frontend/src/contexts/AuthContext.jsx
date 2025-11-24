import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

// ✅ GET BACKEND URL (must use VITE_)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);   // 👈 Must use state!

    // 🔁 Persistent Login on Hard Reload
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            setUser(null);
            return;
        }

        // verify token & load profile
        const fetchUser = async () => {
            try {
                const res = await fetch(`${BACKEND_URL}/user/me`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                });

                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                } else {
                    localStorage.removeItem("token"); // If bad token
                    setUser(null);
                }
            } catch (err) {
                setUser(null);
            }
        };

        fetchUser();
    }, []);

    // 🔐 LOGOUT
    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
        navigate("/");
    };

    // 🔑 LOGIN
    const login = async (username, password) => {
        try {
            const res = await fetch(`${BACKEND_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            if (!res.ok) {
                const err = await res.json();
                return err.message;  // ❌ Return error for UI
            }

            const data = await res.json();
            localStorage.setItem("token", data.token);  // required key
            setUser({ username });   // update context
            navigate("/profile");
        } catch (err) {
            return "Network error, please try again.";
        }
    };

    // 📝 REGISTER
    const register = async (userData) => {
        try {
            const res = await fetch(`${BACKEND_URL}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData),
            });

            if (!res.ok) {
                const err = await res.json();
                return err.message;
            }

            navigate("/success");
        } catch (err) {
            return "Network error, please try again.";
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

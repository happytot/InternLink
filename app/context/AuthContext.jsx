// Supabase client added automatically
import { supabase } from '../../lib/supabaseClient';
// src/context/AuthContext.jsx (FINAL CORRECT VERSION)

import React, { useState, useEffect } from 'react';
// REMOVED firebase import (converted to Supabase)

import { AuthContext } from './AuthContextDefinition'; 
import { auth } from '../firebase'; // Import your initialized auth instance

const AuthProvider = ({ children }) => { // 👈 Changed from 'export const'
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });
        return unsubscribe; // Cleanup subscription on unmount
    }, []);

    const value = {
        currentUser,
        loading
    };

    // Prevent rendering app content before the authentication state is known
    if (loading) {
        return <div>Loading authentication...</div>;
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// 🌟 Exported as default to resolve module import errors
export default AuthProvider;
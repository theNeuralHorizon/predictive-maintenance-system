
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login, user } = useAuth();

    useEffect(() => {
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (token) {
            login(token);
        } else if (error) {
            console.error("Auth Error:", error);
            navigate('/');
        }
    }, [searchParams, login, navigate]);

    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#060608] text-white">
            <div className="animate-pulse">Authenticating...</div>
        </div>
    );
};

export default AuthCallback;

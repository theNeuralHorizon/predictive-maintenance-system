
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();

    useEffect(() => {
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (token) {
            login(token);
            navigate('/dashboard');
        } else if (error) {
            console.error("Auth Error:", error);
            navigate('/'); // Or show error page
        } else {
            navigate('/');
        }
    }, [searchParams, navigate, login]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#060608] text-white">
            <div className="animate-pulse">Authenticating...</div>
        </div>
    );
};

export default AuthCallback;

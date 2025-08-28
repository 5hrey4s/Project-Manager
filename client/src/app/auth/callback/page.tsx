'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';

export default function AuthCallbackPage() {
    const { login } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const token = searchParams.get('token');

        if (token) {
            // Use the login function from our AuthContext to save the token
            login(token).then(() => {
                // After successful login, redirect to the dashboard
                router.push('/dashboard');
            });
        } else {
            // If for some reason there's no token, redirect to the login page with an error
            router.push('/login?error=auth_failed');
        }
    }, [login, router, searchParams]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <p className="text-lg font-semibold">Authenticating...</p>
                <p className="text-gray-500">Please wait while we log you in.</p>
            </div>
        </div>
    );
}
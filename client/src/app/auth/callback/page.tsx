'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';

export default function AuthCallbackPage() {
    const { login } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const handleLoginAndRedirect = async () => {
            const token = searchParams.get('token');
            if (token) {
                // *** THE FIX: First, await for the login state to be set. ***
                await login(token);
                
                // *** THE FIX: THEN, perform the redirect. ***
                router.push('/dashboard');
            } else {
                router.push('/login?error=auth_failed');
            }
        };

        handleLoginAndRedirect();
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
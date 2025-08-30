'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';

export default function AuthCallbackPage() {
    const { login } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
            debugger; // <-- This is our breakpoint
        const handleLogin = async () => {
            const token = searchParams.get('token');

            if (token) {
                // By awaiting the login promise, we ensure it fully completes
                // before this function moves on.
                await login(token);
                // Now, the user state is set and the redirect inside login() has executed.
            } else {
                router.push('/login?error=auth_failed');
            }
        };

        handleLogin();
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
'use client';

import { useState } from 'react';
import axios, { isAxiosError } from 'axios';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth(); // <-- Get the login function from context

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => { // Correct type       
 e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/users/login`, {
                email,
                password
            });
            
            if (response.data.token) {
                // --- FIX: Use the context's login function ---
                await login(response.data.token);
            } else {
                setError('Login successful, but no token was received.');
            }

        } catch (err: unknown) {
            if (isAxiosError(err) && err.response) {
                setError(err.response.data.msg || 'Login failed. Please check your credentials.');
            } else {
                setError('An unexpected error occurred.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900">
                        KanbanFlow
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Welcome back! Sign in to your account.
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email-address" className="sr-only">Email address</label>
                        <input
                            id="email-address"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="sr-only">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-3 px-4 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400"
                        >
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </div>
                </form>

              <p className="text-sm text-center text-gray-600">
    Don&apos;t have an account?{' '} s
    <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
        Sign up
    </Link>
</p>
            </div>
        </div>
    );
}
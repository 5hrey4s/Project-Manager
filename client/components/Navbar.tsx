'use client';

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell'; // <<< Import the new component
import { Button } from '@/components/ui/button';

export default function Navbar() {
    const { user, logout, isAuthenticated } = useAuth();

    return (
        <nav className="bg-white border-b sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    <Link href={isAuthenticated ? "/dashboard" : "/"} className="text-2xl font-bold text-gray-800">
                        KanbanFlow
                    </Link>
                    <div className="flex items-center space-x-4">
                        {isAuthenticated && user ? (
                            <>
                                <NotificationBell /> {/* <<< Add the component here */}
                                <span className="text-gray-700">Hello, {user.username}</span>
                                <Button variant="ghost" onClick={logout}>Logout</Button>
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" asChild>
                                    <Link href="/login">Login</Link>
                                </Button>
                                <Button asChild>
                                    <Link href="/register">Sign Up</Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
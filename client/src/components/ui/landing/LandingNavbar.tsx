'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

export default function LandingNavbar() {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
                <div className="mr-4 flex items-center">
                    <span className="font-bold text-lg">KanbanFlow</span>
                </div>
                <nav className="flex items-center space-x-6 text-sm font-medium">
                    {/* We will add links here later, e.g., Features, Pricing */}
                </nav>
                <div className="flex flex-1 items-center justify-end space-x-4">
                    <Button variant="ghost" asChild>
                        <Link href="/login">
                            <LogIn className="mr-2 h-4 w-4" />
                            Login
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/register">Get Started</Link>
                    </Button>
                </div>
            </div>
        </header>
    );
}
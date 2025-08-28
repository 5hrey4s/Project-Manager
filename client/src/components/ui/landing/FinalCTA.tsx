'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function FinalCTA() {
    return (
        <section className="py-24 bg-gray-900 text-white">
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                    Ready to Transform Your Workflow?
                </h2>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-300">
                    Stop juggling tabs and start shipping features. Join thousands of teams getting more done with KanbanFlow.
                </p>
                <div className="mt-8">
                    <Button size="lg" asChild className="bg-white text-gray-900 hover:bg-gray-200">
                        <Link href="/register">Get Started - It&apos;s Free</Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
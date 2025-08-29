'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import AnimatedKanbanBoard from "./AnimatedKanbanBoard"; // <<< Import the new component

export default function HeroSection() {
    return (
        <section className="py-24 md:py-32 lg:py-40">
            <div className="container px-4 md:px-6 text-center">
                <div className="max-w-3xl mx-auto space-y-6">
                    <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                        Bring Clarity to Your Chaos.
                    </h1>
                    <p className="text-lg text-muted-foreground md:text-xl">
                        KanbanFlow is the intuitive, AI-powered project manager that helps your team achieve its goals faster and with less friction.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" asChild>
                            <Link href="/register">Get Started - It&apos;s Free</Link>
                        </Button>
                        <Button size="lg" variant="outline">
                            Watch a 2-min Demo
                        </Button>
                    </div>
                </div>

                {/* --- Replace the placeholder div with our new animated component --- */}
                <div className="mt-16 mx-auto w-full max-w-5xl h-96">
                    <AnimatedKanbanBoard />
                </div>
            </div>
        </section>
    );
}
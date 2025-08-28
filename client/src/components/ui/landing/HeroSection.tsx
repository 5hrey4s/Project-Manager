'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";

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

                {/* Placeholder for our future animated visual */}
                <div className="mt-16 mx-auto w-full max-w-5xl h-96 rounded-xl bg-muted border-dashed border-2 flex items-center justify-center">
                    <p className="text-muted-foreground">[Animated Product Visual Here]</p>
                </div>
            </div>
        </section>
    );
}
'use client';

import { Users, Target, BarChart } from 'lucide-react';
import { ReactNode } from 'react';

// A reusable card component for each benefit
const BenefitCard = ({ icon, title, children }: { icon: ReactNode, title: string, children: ReactNode }) => (
    <div className="bg-card p-6 rounded-lg border shadow-sm">
        <div className="flex items-center gap-4 mb-4">
            <div className="bg-primary/10 p-3 rounded-full text-primary">
                {icon}
            </div>
            <h3 className="text-xl font-semibold">{title}</h3>
        </div>
        <p className="text-muted-foreground">
            {children}
        </p>
    </div>
);


export default function BenefitsSection() {
    return (
        <section className="py-24 bg-muted/30 dark:bg-card">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                        A Better Workflow for Everyone
                    </h2>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                        KanbanFlow is designed to enhance productivity and clarity for every member of your team.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <BenefitCard icon={<BarChart className="w-6 h-6" />} title="For Project Managers">
                        Gain a bird&apos;s-eye view of all projects. Track progress in real-time without constant meetings and follow-ups.
                    </BenefitCard>
                    <BenefitCard icon={<Users className="w-6 h-6" />} title="For Teams">
                        Eliminate confusion with a single source of truth. Everyone knows who is doing what and by when, fostering accountability and collaboration.
                    </BenefitCard>
                    <BenefitCard icon={<Target className="w-6 h-6" />} title="For Individuals">
                        Focus on your most important work. Organize your tasks, prioritize your day, and see the direct impact of your contributions.
                    </BenefitCard>
                </div>
            </div>
        </section>
    );
}
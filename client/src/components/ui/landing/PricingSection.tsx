'use client';

import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const PricingCard = ({ title, price, description, features, popular = false }: { title: string, price: string, description: string, features: string[], popular?: boolean }) => (
    <Card className={popular ? 'border-primary shadow-lg' : ''}>
        <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="text-4xl font-bold">{price}</div>
            <ul className="space-y-2">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary" />
                        <span className="text-muted-foreground">{feature}</span>
                    </li>
                ))}
            </ul>
        </CardContent>
        <CardFooter>
            <Button className="w-full" variant={popular ? 'default' : 'outline'}>
                Get Started
            </Button>
        </CardFooter>
    </Card>
);

export default function PricingSection() {
    return (
        <section className="py-24 bg-background">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                        The Perfect Plan for Your Team
                    </h2>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                        Start for free and scale as you grow. No credit card required.
                    </p>
                </div>

                <div className="flex items-center justify-center space-x-2 mb-10">
                    <Label htmlFor="billing-cycle">Monthly</Label>
                    <Switch id="billing-cycle" disabled />
                    <Label htmlFor="billing-cycle">Yearly</Label>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    <PricingCard
                        title="Hobby"
                        price="₹0"
                        description="For individuals and small projects."
                        features={['3 Projects', 'Up to 5 members', 'AI Assistant (Basic)', 'Community Support']}
                    />
                    <PricingCard
                        title="Pro"
                        price="₹999"
                        description="For growing teams that need more power."
                        features={['Unlimited Projects', 'Unlimited Members', 'AI Assistant (Advanced)', 'Priority Support']}
                        popular={true}
                    />
                    <PricingCard
                        title="Enterprise"
                        price="Contact Us"
                        description="For large organizations with custom needs."
                        features={['All in Pro', 'Dedicated Support', 'Advanced Security', 'Custom Integrations']}
                    />
                </div>
            </div>
        </section>
    );
}
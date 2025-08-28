'use client';

import { motion } from 'framer-motion';

interface FeatureCardProps {
    title: string;
    description: string;
    onInView: () => void;
}

export default function FeatureCard({ title, description, onInView }: FeatureCardProps) {
    return (
        <motion.div
            className="p-8 rounded-lg border bg-card text-card-foreground shadow-sm"
            onViewportEnter={onInView} // This is the magic prop!
            viewport={{ amount: 0.5 }} // Trigger when 50% of the card is visible
        >
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
        </motion.div>
    );
}
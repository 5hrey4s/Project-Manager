'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FeatureCard from './FeatureCard';
import FeatureVisual from './FeatureVisual';

// Define the features we want to showcase
const features = [
  {
    id: 1,
    title: 'Visual Kanban Boards',
    description: 'Effortlessly track your team\'s progress with our intuitive drag-and-drop Kanban boards. See the status of every task at a glance and identify bottlenecks before they happen.',
    visual: 'kanban'
  },
  {
    id: 2,
    title: 'Real-Time Collaboration',
    description: 'Work together seamlessly. Comments, assignments, and status updates appear instantly for everyone on the project, keeping your entire team in sync without constant meetings.',
    visual: 'collaboration'
  },
  {
    id: 3,
    title: 'AI-Powered Assistant',
    description: 'Let our intelligent copilot handle the busywork. Generate tasks from a simple prompt, get smart suggestions, and summarize project progress to save time and mental energy.',
    visual: 'ai'
  },
  {
    id: 4,
    title: 'In-Depth Task Details',
    description: 'Capture all necessary information in one place. Add detailed descriptions, attach files, set due dates, and assign labels to ensure everyone has the context they need to succeed.',
    visual: 'details'
  },
];

export default function FeatureShowcase() {
  const [activeFeature, setActiveFeature] = useState(features[0].visual);

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Everything You Need to Succeed
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            KanbanFlow is packed with powerful features to help your team get more done, with less stress.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-16 items-start">
          {/* Left Side: Scrolling Feature Cards */}
          <div className="flex flex-col gap-12">
            {features.map((feature) => (
              <FeatureCard 
                key={feature.id}
                title={feature.title}
                description={feature.description}
                onInView={() => setActiveFeature(feature.visual)}
              />
            ))}
          </div>

          {/* Right Side: Sticky Visual Pane */}
          <div className="sticky top-24">
             <AnimatePresence mode="wait">
                 <motion.div
                    key={activeFeature}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                 >
                    <FeatureVisual type={activeFeature} />
                 </motion.div>
             </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
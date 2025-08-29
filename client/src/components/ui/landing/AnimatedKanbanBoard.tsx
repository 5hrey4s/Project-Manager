'use client';

import { motion, useAnimationControls, MotionStyle } from 'framer-motion';
import { useEffect } from 'react';
import { Bot, Check, User } from 'lucide-react';

// --- Reusable Animated Components ---
const AnimatedCard = ({ children, layoutId, className = '' }: { children: React.ReactNode, layoutId: string, className?: string }) => (
    <motion.div
        layoutId={layoutId}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`bg-card p-3 rounded-lg shadow-md border ${className}`}
    >
        {children}
    </motion.div>
);

const Column = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="flex flex-col gap-3 p-3 bg-muted/50 rounded-xl w-full">
        <h3 className="text-sm font-semibold text-muted-foreground px-1">{title}</h3>
        <div className="flex flex-col gap-3 h-full">{children}</div>
    </div>
);


export default function AnimatedKanbanBoard() {
    const controls = useAnimationControls();
    
    // Define the animation sequence
    const sequence = async () => {
        await controls.start('start');
        await new Promise(resolve => setTimeout(resolve, 1500));
        await controls.start('inProgress');
        await new Promise(resolve => setTimeout(resolve, 1500));
        await controls.start('assign');
        await new Promise(resolve => setTimeout(resolve, 1500));
        await controls.start('done');
        await new Promise(resolve => setTimeout(resolve, 2000));
        await controls.start('aiGenerate');
        await new Promise(resolve => setTimeout(resolve, 2500));
        sequence(); 
    };

    useEffect(() => {
        sequence();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- Animation Variants ---
    const variants = {
        start: { '--col1-opacity': 1, '--col2-opacity': 0, '--col3-opacity': 0 },
        inProgress: { '--col1-opacity': 0, '--col2-opacity': 1, '--col3-opacity': 0 },
        assign: { '--assign-opacity': 1, '--assign-scale': 1 },
        done: { '--col1-opacity': 0, '--col2-opacity': 0, '--col3-opacity': 1, '--done-opacity': 1, '--done-scale': 1 },
        aiGenerate: { '--ai-opacity': 1, '--task2-opacity': 1, '--task3-opacity': 1 },
    };

    return (
        <motion.div
            animate={controls}
            variants={variants}
            initial={{ 
                '--col1-opacity': 0, '--col2-opacity': 0, '--col3-opacity': 0,
                '--assign-opacity': 0, '--assign-scale': 0,
                '--done-opacity': 0, '--done-scale': 0.5,
                '--ai-opacity': 0, '--task2-opacity': 0, '--task3-opacity': 0,
            }}
            className="w-full h-full p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black rounded-xl shadow-2xl border"
        >
            <div className="grid grid-cols-3 gap-4 h-full">
                {/* Column 1: To Do */}
                <Column title="To Do">
                    <motion.div style={{ opacity: 'var(--col1-opacity)' } as MotionStyle}>
                        <AnimatedCard layoutId="task1">
                            <p className="font-medium text-sm">Design landing page</p>
                        </AnimatedCard>
                    </motion.div>
                    <motion.div style={{ opacity: 'var(--task2-opacity)' } as MotionStyle} transition={{ delay: 0.2 }}>
                        <AnimatedCard layoutId="task2">
                             <p className="font-medium text-sm">Implement user auth</p>
                        </AnimatedCard>
                    </motion.div>
                    <motion.div style={{ opacity: 'var(--task3-opacity)' } as MotionStyle} transition={{ delay: 0.4 }}>
                        <AnimatedCard layoutId="task3">
                             <p className="font-medium text-sm">Deploy to production</p>
                        </AnimatedCard>
                    </motion.div>
                    <motion.div 
                        className="flex items-center gap-2 p-3 text-sm text-purple-600 dark:text-purple-400"
                        style={{ opacity: 'var(--ai-opacity)' } as MotionStyle}
                        initial={{ y: 10 }}
                        transition={{ duration: 0.5 }}
                    >
                       <Bot className="w-5 h-5"/> AI generated tasks
                    </motion.div>
                </Column>
                
                {/* Column 2: In Progress */}
                <Column title="In Progress">
                    <motion.div style={{ opacity: 'var(--col2-opacity)' } as MotionStyle}>
                        <AnimatedCard layoutId="task1">
                            <p className="font-medium text-sm">Design landing page</p>
                            <motion.div 
                                className="flex items-center gap-2 mt-2"
                                style={{ opacity: 'var(--assign-opacity)', scale: 'var(--assign-scale)' } as MotionStyle}
                                transition={{ delay: 0.3 }}
                            >
                                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white">
                                    <User className="w-3 h-3"/>
                                </div>
                                <span className="text-xs text-muted-foreground">Assigned</span>
                            </motion.div>
                        </AnimatedCard>
                    </motion.div>
                </Column>

                {/* Column 3: Done */}
                <Column title="Done">
                    <motion.div style={{ opacity: 'var(--col3-opacity)' } as MotionStyle}>
                        <AnimatedCard layoutId="task1" className="bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500/50">
                            <p className="font-medium text-sm text-emerald-800 dark:text-emerald-300">Design landing page</p>
                            <motion.div 
                                className="flex items-center gap-2 mt-2 text-emerald-600 dark:text-emerald-400"
                                style={{ opacity: 'var(--done-opacity)', scale: 'var(--done-scale)' } as MotionStyle}
                                transition={{ delay: 0.3 }}
                            >
                                <Check className="w-4 h-4" />
                                <span className="text-xs font-semibold">Completed</span>
                            </motion.div>
                        </AnimatedCard>
                    </motion.div>
                </Column>
            </div>
        </motion.div>
    );
}
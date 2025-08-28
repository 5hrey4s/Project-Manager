'use client';

interface FeatureVisualProps {
    type: string;
}

const visuals: { [key: string]: { title: string, bg: string } } = {
    kanban: { title: 'Visual: Drag & Drop Kanban Board', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    collaboration: { title: 'Visual: Real-time Comments Appearing', bg: 'bg-green-100 dark:bg-green-900/30' },
    ai: { title: 'Visual: AI Generating Tasks', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    details: { title: 'Visual: Detailed Task Modal Opening', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
};

export default function FeatureVisual({ type }: FeatureVisualProps) {
    const visual = visuals[type] || visuals.kanban;

    return (
        <div className={`w-full h-[500px] rounded-xl border-2 border-dashed flex items-center justify-center p-8 ${visual.bg}`}>
            <p className="text-xl font-semibold text-muted-foreground text-center">
                {visual.title}
            </p>
        </div>
    );
}
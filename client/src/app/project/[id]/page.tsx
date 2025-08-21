'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import ProjectHeader from '../../../../components/ProjectHeader';
import KanbanBoard from '../../../../components/KanbanBoard';
import CopilotChat from '../../../../components/CopilotChat';
import AiTaskGeneratorModal from '../../../../components/AiTaskGeneratorModal';
import { useProjectData } from '../../../../hooks/useProjectData';



export default function ProjectPage() {
    const params = useParams();
    const projectId = params.id as string;
    
    // All data fetching and state is handled by our clean custom hook
    const { project, tasks, members, loading, setTasks } = useProjectData(projectId);

    // State that this page component still needs to manage
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [isCopilotOpen, setIsCopilotOpen] = useState(false);
    
    if (loading) {
        return <p className="text-center mt-10">Loading project...</p>;
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
            <ProjectHeader project={project} onOpenAiModal={() => setIsAiModalOpen(true)} />
            
            <KanbanBoard 
                tasks={tasks}
                members={members}
                setTasks={setTasks}
            />
            
            {isAiModalOpen && (
                <AiTaskGeneratorModal
                    projectId={projectId}
                    onClose={() => setIsAiModalOpen(false)}
                    setTasks={setTasks}
                />
            )}
            
            {!isCopilotOpen && (
                <button
                    onClick={() => setIsCopilotOpen(true)}
                    className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-transform hover:scale-110"
                    title="Open AI Copilot"
                >
                    🤖
                </button>
            )}

            {isCopilotOpen && (
                <CopilotChat projectId={projectId} onClose={() => setIsCopilotOpen(false)} />
            )}
        </div>
    );
}
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import ProjectHeader from '../../../../components/ProjectHeader';
import KanbanBoard from '../../../../components/KanbanBoard';
import CopilotChat from '../../../../components/CopilotChat';
import AiTaskGeneratorModal from '../../../../components/AiTaskGeneratorModal';
import { useProjectData } from '../../../../hooks/useProjectData';
import TaskDetailsModal from '../../../../components/TaskDetailsModal'; // Import the modal

export default function ProjectPage() {
    const params = useParams();
    const projectId = params.id as string;
    
    const { project, tasks, members, loading, setTasks } = useProjectData(projectId);

    // --- State for managing modals ---
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [isCopilotOpen, setIsCopilotOpen] = useState(false);
    
    const handleOpenTaskModal = (taskId: number) => {
        setSelectedTaskId(taskId);
        setIsTaskModalOpen(true);
    };

    const handleCloseTaskModal = () => {
        setIsTaskModalOpen(false);
        setSelectedTaskId(null);
    };
    
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
                onTaskClick={handleOpenTaskModal} // Pass the click handler
            />
            
            {isAiModalOpen && (
                <AiTaskGeneratorModal
                    projectId={projectId}
                    onClose={() => setIsAiModalOpen(false)}
                    setTasks={setTasks}
                />
            )}
            
            {/* --- Pass the necessary props to the TaskDetailsModal --- */}
            <TaskDetailsModal 
                taskId={selectedTaskId}
                isOpen={isTaskModalOpen}
                onClose={handleCloseTaskModal}
                projectId={parseInt(projectId, 10)} // Pass the projectId
            />

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
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import ProjectHeader from '../../../../components/ProjectHeader';
import KanbanBoard, { Task } from '../../../../components/KanbanBoard';
import CopilotChat from '../../../../components/CopilotChat';
import AiTaskGeneratorModal from '../../../../components/AiTaskGeneratorModal';
import TaskDetailsModal from '../../../../components/TaskDetailsModal';
import { useProjectData } from '../../../../hooks/useProjectData';
import { Button } from '@/components/ui/button';
import CreateTaskModal from '../../../../components/CreateTaskModal';

type TaskStatus = "To Do" | "In Progress" | "Done";

export default function ProjectPage() {
    const params = useParams();
    const projectId = params.id as string;
    
    // --- Custom hook for data fetching ---
    const { project, tasks, members, loading, setTasks } = useProjectData(projectId);

    // --- State for managing modals ---
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [isCopilotOpen, setIsCopilotOpen] = useState(false);
        const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [defaultColumn, setDefaultColumn] = useState<TaskStatus>("To Do");

    // --- Real-time listeners for task creation and deletion ---
    useEffect(() => {
        if (!projectId) return;
        const socket: Socket = io(process.env.NEXT_PUBLIC_API_URL!);
        socket.emit('join_project', `project-${projectId}`);

        socket.on('task_created', (newTask: Task) => {
            setTasks(currentTasks => [...currentTasks, newTask]);
        });
        
        socket.on('task_deleted', (data: { taskId: number }) => {
            setTasks(currentTasks => currentTasks.filter(task => task.id !== data.taskId));
        });

        return () => {
            socket.emit('leave_project', `project-${projectId}`);
            socket.disconnect();
        };
    }, [projectId, setTasks]);

    const handleOpenCreateModal = (status: TaskStatus) => {
        setDefaultColumn(status);
        setIsCreateModalOpen(true);
    };

    const handleCloseCreateModal = () => {
        setIsCreateModalOpen(false);
    };


    // --- Modal Control Functions ---
    const handleOpenTaskModal = (taskId: number) => {
        setSelectedTaskId(taskId);
        setIsTaskModalOpen(true);
    };

    const handleCloseTaskModal = () => {
        setIsTaskModalOpen(false);
        setSelectedTaskId(null);
    };

    // --- Callback for when a task is deleted inside the modal ---
    const handleTaskDeleted = (deletedTaskId: number) => {
        // Optimistically remove the task from the UI
        setTasks(currentTasks => currentTasks.filter(task => task.id !== deletedTaskId));
    };
    
    if (loading) {
        return <div className="flex items-center justify-center min-h-screen"><p>Loading project...</p></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-8">
            <ProjectHeader project={project} onOpenAiModal={() => setIsAiModalOpen(true)} />
            
            <main className="mt-8">
                       <KanbanBoard
          projectId={projectId}
          members={members}
          onTaskClick={handleOpenTaskModal}
        />

            </main>
            
            {isAiModalOpen && (
                <AiTaskGeneratorModal
                    projectId={projectId}
                    onClose={() => setIsAiModalOpen(false)}
                    setTasks={setTasks}
                />
            )}
               

            
            <TaskDetailsModal 
                taskId={selectedTaskId}
                isOpen={isTaskModalOpen}
                onClose={handleCloseTaskModal}
                projectId={parseInt(projectId, 10)}
                onTaskDeleted={handleTaskDeleted} // <<< Pass the callback here
            />
         <CreateTaskModal
                isOpen={isCreateModalOpen}
                onClose={handleCloseCreateModal}
                projectId={parseInt(projectId, 10)}
                column={defaultColumn}
            />
            {!isCopilotOpen && (
                <Button
                    onClick={() => setIsCopilotOpen(true)}
                    className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg"
                    title="Open AI Copilot"
                >
                    🤖
                </Button>
            )}

            {isCopilotOpen && (
                <CopilotChat projectId={projectId} onClose={() => setIsCopilotOpen(false)} />
            )}
        </div>
    );
}
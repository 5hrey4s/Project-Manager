'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

// --- Component Imports ---
import ProjectHeader from '../../../../components/ProjectHeader';
import KanbanBoard, { Task } from '../../../../components/KanbanBoard';
import TaskDetailsModal from '../../../../components/TaskDetailsModal';
import CreateTaskModal from '../../../../components/CreateTaskModal';
import AiTaskGeneratorModal from '../../../../components/AiTaskGeneratorModal';
import CopilotChat from '../../../../components/CopilotChat';
import ProjectCalendarView from '../../../../components/ProjectCalendarView'; // Import the new calendar view

// --- Hook & UI Imports ---
import { useProjectData } from '../../../../hooks/useProjectData';
import { Button } from '@/components/ui/button';
import { LayoutGrid, Calendar } from 'lucide-react';

type TaskStatus = "To Do" | "In Progress" | "Done";
type ViewMode = 'board' | 'calendar'; // Define the possible view modes

export default function ProjectPage() {
    const params = useParams();
    const projectId = params.id as string;
    
    const { project, members, tasks, loading, setTasks } = useProjectData(projectId);
    
    // --- State for Modals and Views ---
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [defaultColumn, setDefaultColumn] = useState<TaskStatus>("To Do");
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [isCopilotOpen, setIsCopilotOpen] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('board'); // ADDED: State for the view switcher

    useEffect(() => {
        if (!projectId) return;
        const socket: Socket = io(process.env.NEXT_PUBLIC_API_URL!);
        socket.emit('join_project', `project-${projectId}`);

        socket.on('task_created', (newTask: Task) => setTasks(currentTasks => [...currentTasks, newTask]));
        socket.on('task_updated', (updatedTask: Task) => {
            setTasks(currentTasks => currentTasks.map(t => t.id === updatedTask.id ? updatedTask : t));
        });
        socket.on('task_deleted', (data: { taskId: number }) => {
            setTasks(currentTasks => currentTasks.filter(task => task.id !== data.taskId));
            if (selectedTaskId === data.taskId) setSelectedTaskId(null);
        });

        return () => {
            socket.emit('leave_project', `project-${projectId}`);
            socket.disconnect();
        };
    }, [projectId, setTasks, selectedTaskId]);

    // --- Modal Handlers ---
    const handleOpenCreateModal = (status: TaskStatus) => {
        setDefaultColumn(status);
        setIsCreateModalOpen(true);
    };
    const handleOpenTaskModal = (taskId: number) => setSelectedTaskId(taskId);
    const handleCloseTaskModal = () => setSelectedTaskId(null);

    if (loading) return <div className="flex items-center justify-center min-h-screen"><p>Loading project...</p></div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-8">
            <ProjectHeader project={project} onOpenAiModal={() => setIsAiModalOpen(true)} />
            
            {/* --- ADDED: View Switcher UI --- */}
            <div className="my-6 flex items-center gap-2">
                <Button variant={viewMode === 'board' ? 'secondary' : 'ghost'} onClick={() => setViewMode('board')}>
                    <LayoutGrid className="w-4 h-4 mr-2" /> Board
                </Button>
                <Button variant={viewMode === 'calendar' ? 'secondary' : 'ghost'} onClick={() => setViewMode('calendar')}>
                    <Calendar className="w-4 h-4 mr-2" /> Calendar
                </Button>
            </div>

            <main>
                {/* --- ADDED: Conditional Rendering for the selected view --- */}
                {viewMode === 'board' ? (
                    <KanbanBoard
                        projectId={projectId}
                        members={members}
                        tasks={tasks}
                        setTasks={setTasks}
                        onTaskClick={handleOpenTaskModal}
                        onAddTask={handleOpenCreateModal}
                    />
                ) : (
                    <ProjectCalendarView
                        projectId={parseInt(projectId, 10)}
                        onTaskClick={handleOpenTaskModal}
                    />
                )}
            </main>
            
            {/* --- All Modals (Unchanged) --- */}
            <TaskDetailsModal taskId={selectedTaskId} onClose={handleCloseTaskModal} />
            <CreateTaskModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} projectId={parseInt(projectId, 10)} column={defaultColumn} />
            {isAiModalOpen && <AiTaskGeneratorModal projectId={projectId} onClose={() => setIsAiModalOpen(false)} setTasks={setTasks} />}
            {isCopilotOpen && <CopilotChat projectId={projectId} onClose={() => setIsCopilotOpen(false)} />}

            {!isCopilotOpen && <Button onClick={() => setIsCopilotOpen(true)} className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg">🤖</Button>}
        </div>
    );
}
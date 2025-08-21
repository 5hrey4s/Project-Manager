import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProjectDetails, getProjectTasks, getProjectMembers } from '../services/api';
import { io, Socket } from 'socket.io-client';

// --- Define complete and consistent types ---
export type TaskStatus = 'To Do' | 'In Progress' | 'Done';

export interface Project {
  id: number;
  name: string;
  description: string | null;
}

export interface Task {
  id: number;
  title: string;
  status: TaskStatus;
  assignee_id: number | null;
  project_id: number;
}

export interface Member {
  id: number;
  username: string;
}

export function useProjectData(projectId: string | null) {
    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (!projectId) return;
        
        // --- WebSocket Setup ---
        const socket: Socket = io(process.env.NEXT_PUBLIC_API_URL!);

        const fetchData = async () => {
            setLoading(true);
            try {
                const [projRes, tasksRes, membersRes] = await Promise.all([
                    getProjectDetails(projectId),
                    getProjectTasks(projectId),
                    getProjectMembers(projectId),
                ]);
                setProject(projRes.data);
                setTasks(tasksRes.data);
                setMembers(membersRes.data);
            } catch (err) {
                console.error("Failed to fetch project data", err);
                router.push('/dashboard');
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
        
        // --- Real-time updates logic ---
        socket.emit('join_project', projectId);

        socket.on('task_updated', (updatedTask: Task) => {
            // Check if the update belongs to the current project
            if (updatedTask.project_id.toString() === projectId) {
                setTasks(prevTasks => 
                    prevTasks.map(task => 
                        task.id === updatedTask.id ? updatedTask : task
                    )
                );
            }
        });
        
        // --- Cleanup function ---
        // This runs when the component unmounts to prevent memory leaks
        return () => {
            socket.disconnect();
        };

    }, [projectId, router]);
    
    // Return the state and the setter for tasks so components can update it
    return { project, tasks, members, loading, setTasks };
}
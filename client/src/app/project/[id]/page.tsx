'use client';

import { useEffect, useState, FormEvent, ChangeEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';

// Dnd-kit imports
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';

// --- Define Types ---
type TaskStatus = 'To Do' | 'In Progress' | 'Done';

interface Project {
  id: number;
  name: string;
  description: string | null;
}

interface Task {
  id: number;
  title: string;
  status: TaskStatus;
  project_id: number;
  assignee_id: number | null;
}

interface Member {
  id: number;
  username: string;
}

// --- Reusable UI Components ---

function TaskCard({ task, members, onAssign }: { task: Task; members: Member[]; onAssign: (taskId: number, assigneeId: number | null) => void; }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const assignee = members.find(m => m.id === task.assignee_id);

  const handleAssignmentChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newAssigneeId = e.target.value === 'unassigned' ? null : parseInt(e.target.value, 10);
    onAssign(task.id, newAssigneeId);
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="bg-white p-4 mb-3 rounded-lg shadow touch-none border-l-4 border-transparent hover:border-indigo-500">
      <p className="font-medium text-gray-800">{task.title}</p>
      <div className="mt-3 flex justify-between items-center">
        <div className="flex items-center">
          <select
            value={task.assignee_id ?? 'unassigned'}
            onChange={handleAssignmentChange}
            onClick={(e) => e.stopPropagation()} // Prevents drag from starting on select click
            className="text-xs p-1 border border-gray-300 rounded-md bg-gray-50 hover:bg-gray-100 focus:outline-none"
          >
            <option value="unassigned">Unassigned</option>
            {members.map(member => (
              <option key={member.id} value={member.id}>
                {member.username}
              </option>
            ))}
          </select>
        </div>
        {assignee && (
          <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold" title={assignee.username}>
            {assignee.username.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}

function Column({ id, title, tasks, members, onAssign }: { id: TaskStatus; title: string; tasks: Task[]; members: Member[]; onAssign: (taskId: number, assigneeId: number | null) => void; }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className="bg-gray-200 p-4 rounded-lg shadow-inner w-full">
      <h2 className="font-bold mb-4 text-lg text-gray-800">{title}</h2>
      <SortableContext id={id} items={tasks.map(t => t.id)}>
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} members={members} onAssign={onAssign} />
        ))}
      </SortableContext>
    </div>
  );
}

// --- Main Page Component ---
export default function ProjectPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  
  // AI Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiGoal, setAiGoal] = useState('');
  const [suggestedTasks, setSuggestedTasks] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  useEffect(() => {
    if (!projectId) return;

    const socket: Socket = io(process.env.NEXT_PUBLIC_API_URL!);
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    const axiosConfig = { headers: { 'x-auth-token': token } };

    const fetchData = async () => {
      try {
        const [projectResponse, tasksResponse, membersResponse] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}`, axiosConfig),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/tasks`, axiosConfig),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/members`, axiosConfig)
        ]);
        setProject(projectResponse.data);
        setTasks(tasksResponse.data);
        setMembers(membersResponse.data);
      } catch (error) {
        console.error('Failed to fetch project data', error);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    socket.emit('join_project', projectId);
    socket.on('task_updated', (updatedTask: Task) => {
      if (updatedTask.project_id.toString() === projectId) {
        setTasks(prevTasks => prevTasks.map(task => task.id === updatedTask.id ? updatedTask : task));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [projectId, router]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 10 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeTaskId = active.id;
    const destinationColumnId = over.id as TaskStatus;
    const draggedTask = tasks.find(task => task.id === activeTaskId);
    if (draggedTask && draggedTask.status !== destinationColumnId) {
      handleStatusChange(activeTaskId as number, destinationColumnId);
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: TaskStatus) => {
    setTasks(prevTasks => prevTasks.map(task =>
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${taskId}/status`,
        { status: newStatus },
        { headers: { 'x-auth-token': token } }
      );
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const handleInvite = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setInviteMessage('');
    setIsInviting(true);
    const token = localStorage.getItem('token');
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/members`,
        { email: inviteEmail },
        { headers: { 'x-auth-token': token } }
      );
      setInviteMessage(`Successfully invited ${inviteEmail}!`);
      setInviteEmail('');
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setInviteMessage(error.response?.data.msg || 'Invitation failed.');
      } else {
        setInviteMessage('An unexpected error occurred.');
      }
    } finally {
      setIsInviting(false);
    }
  };
  
  const handleAssignTask = async (taskId: number, assigneeId: number | null) => {
    setTasks(prevTasks => prevTasks.map(task =>
      task.id === taskId ? { ...task, assignee_id: assigneeId } : task
    ));
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${taskId}/assign`,
        { assigneeId },
        { headers: { 'x-auth-token': token } }
      );
    } catch (error) {
      console.error('Failed to assign task', error);
    }
  };

  const handleGenerateTasks = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsGenerating(true);
    setSuggestedTasks([]);
    setAiError('');
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ai/generate-tasks`,
        { goal: aiGoal, projectId },
        { headers: { 'x-auth-token': token } }
      );
      setSuggestedTasks(response.data.suggestedTasks);
    } catch (error) {
      console.error(error);
      setAiError('Failed to generate tasks. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddTask = async (taskTitle: string) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/api/tasks`,
            { title: taskTitle, projectId: parseInt(projectId, 10) },
            { headers: { 'x-auth-token': token } }
        );
        setTasks(prevTasks => [...prevTasks, response.data]);
        setSuggestedTasks(prev => prev.filter(t => t !== taskTitle));
    } catch (error) {
        console.error("Failed to add task", error);
    }
  };

  const columnDefinitions: { id: TaskStatus, title: string }[] = [
    { id: 'To Do', title: 'To Do' },
    { id: 'In Progress', title: 'In Progress' },
    { id: 'Done', title: 'Done' },
  ];

  if (loading) return <p className="text-center mt-10">Loading project...</p>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <Link href="/dashboard" className="text-indigo-600 hover:underline mb-2 inline-block">&larr; Back to Dashboard</Link>
          <h1 className="text-3xl font-bold">{project ? project.name : 'Project Workspace'}</h1>
        </div>
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="px-4 py-2 font-bold text-white bg-purple-600 rounded-md hover:bg-purple-700 flex items-center gap-2"
          >
            ✨ Generate with AI
          </button>
          <div>
            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row items-stretch gap-2 bg-white p-3 rounded-lg shadow-sm">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Invite user by email"
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <button
                type="submit"
                disabled={isInviting}
                className="px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
              >
                {isInviting ? 'Sending...' : 'Invite'}
              </button>
            </form>
            {inviteMessage && <p className="mt-2 text-center text-sm text-gray-600">{inviteMessage}</p>}
          </div>
        </div>
      </header>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {columnDefinitions.map(({ id, title }) => (
            <Column
              key={id}
              id={id}
              title={title}
              tasks={tasks.filter(task => task.status === id)}
              members={members}
              onAssign={handleAssignTask}
            />
          ))}
        </div>
      </DndContext>
      
      {isAiModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">AI Task Generator</h2>
            <form onSubmit={handleGenerateTasks}>
              <textarea
                value={aiGoal}
                onChange={(e) => setAiGoal(e.target.value)}
                placeholder="Enter a high-level goal... e.g., 'Launch a new marketing website'"
                className="w-full p-2 border border-gray-300 rounded-md h-24"
                required
              />
              <div className="flex justify-end gap-4 mt-4">
                <button type="button" onClick={() => { setIsAiModalOpen(false); setSuggestedTasks([]); setAiError(''); }} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                <button type="submit" disabled={isGenerating} className="px-4 py-2 bg-purple-600 text-white rounded-md disabled:bg-purple-400">
                  {isGenerating ? 'Generating...' : 'Generate Tasks'}
                </button>
              </div>
            </form>
            
            <div className="mt-6">
              {suggestedTasks.length > 0 && <h3 className="font-bold mb-2">Suggested Tasks:</h3>}
              <ul className="space-y-2 max-h-60 overflow-y-auto">
                {suggestedTasks.map((task, index) => (
                  <li key={index} className="flex justify-between items-center bg-gray-100 p-2 rounded-md">
                    <span>{task}</span>
                    <button onClick={() => handleAddTask(task)} className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700">+</button>
                  </li>
                ))}
              </ul>
              {aiError && <p className="text-red-500 mt-4">{aiError}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';

// Dnd-kit imports
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';


// --- Define Types ---
type TaskStatus = 'To Do' | 'In Progress' | 'Done';

interface Task {
  id: number;
  title: string;
  status: TaskStatus;
  project_id: number;
}

// --- Reusable UI Components ---

// TaskCard Component: Represents a single draggable task
function TaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1, // Make the card semi-transparent while dragging
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-3 mb-3 rounded-md shadow touch-none" // touch-none is important for mobile devices
    >
      {task.title}
    </div>
  );
}

// Column Component: Represents a droppable column (e.g., "To Do")
function Column({ id, title, tasks }: { id: TaskStatus, title: string, tasks: Task[] }) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className="bg-gray-200 p-4 rounded-lg shadow-inner w-full"
    >
      <h2 className="font-bold mb-4 text-lg text-gray-800">{title}</h2>
      <SortableContext id={id} items={tasks}>
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </SortableContext>
    </div>
  );
}


// --- Main Page Component ---
export default function ProjectPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  useEffect(() => {
    // ... (This useEffect for fetching data and socket connection remains the same)
    if (!projectId) return;

    const socket: Socket = io("http://localhost:5000");

    const fetchInitialTasks = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      try {
        const response = await axios.get(`http://localhost:5000/api/projects/${projectId}/tasks`, {
          headers: { 'x-auth-token': token },
        });
        setTasks(response.data);
      } catch (error) {
        console.error('Failed to fetch tasks', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialTasks();
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

  const sensors = useSensors(useSensor(PointerSensor, {
    // Require the mouse to move by 10 pixels before activating a drag
    activationConstraint: {
      distance: 10,
    },
  }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    // --- Add this console.log for debugging ---
    console.log('DRAG END EVENT:', { activeId: active.id, overId: over?.id });

    if (!over) {
      return;
    }

    const activeTaskId = active.id;
    const destinationColumnId = over.id as TaskStatus;
    const draggedTask = tasks.find(task => task.id === activeTaskId);

    if (draggedTask && draggedTask.status !== destinationColumnId) {
      setTasks(prevTasks => {
        const activeIndex = prevTasks.findIndex(t => t.id === activeTaskId);
        // Update the status of the dragged task
        prevTasks[activeIndex].status = destinationColumnId;
        return arrayMove(prevTasks, activeIndex, activeIndex); // arrayMove helps re-render correctly
      });

      handleStatusChange(activeTaskId as number, destinationColumnId);
    }
  };
  
  const handleStatusChange = async (taskId: number, newStatus: TaskStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:5000/api/tasks/${taskId}/status`,
        { status: newStatus },
        { headers: { 'x-auth-token': token } }
      );
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const columnDefinitions: { id: TaskStatus, title: string }[] = [
    { id: 'To Do', title: 'To Do' },
    { id: 'In Progress', title: 'In Progress' },
    { id: 'Done', title: 'Done' },
  ];
  
  if (loading) return <p className="text-center mt-10">Loading board...</p>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <header className="mb-8">
        <Link href="/dashboard" className="text-indigo-600 hover:underline mb-4 inline-block">&larr; Back to Dashboard</Link>
        <h1 className="text-3xl font-bold">Kanban Board</h1>
      </header>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {columnDefinitions.map(({ id, title }) => (
            <Column
              key={id}
              id={id}
              title={title}
              tasks={tasks.filter(task => task.status === id)}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
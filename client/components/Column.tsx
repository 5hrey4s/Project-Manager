'use client';

import { SortableContext } from '@dnd-kit/sortable';
import TaskCard from './TaskCard'; // Import the TaskCard we just created
import { useDroppable } from '@dnd-kit/core';

// Define the types needed for this component
type TaskStatus = 'To Do' | 'In Progress' | 'Done';

interface Task {
  id: number;
  title: string;
  status: TaskStatus;
  assignee_id: number | null;
}

interface Member {
  id: number;
  username: string;
}

interface ColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  members: Member[];
  onAssign: (taskId: number, assigneeId: number | null) => void;
}

export default function Column({ id, title, tasks, members, onAssign }: ColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div 
      ref={setNodeRef} 
      className="bg-gray-200 p-4 rounded-lg shadow-inner w-full"
    >
      <h2 className="font-bold mb-4 text-lg text-gray-800">{title}</h2>
      
      {/* This context needs a simple array of unique IDs */}
      <SortableContext id={id} items={tasks.map(t => t.id)}>
        {tasks.map(task => (
          <TaskCard 
            key={task.id} 
            task={task} 
            members={members} 
            onAssign={onAssign} 
          />
        ))}
      </SortableContext>
    </div>
  );
}
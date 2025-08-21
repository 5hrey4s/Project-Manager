'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChangeEvent } from 'react';

// Define the types needed for this component
interface Member {
  id: number;
  username: string;
}

interface Task {
  id: number;
  title: string;
  assignee_id: number | null;
}

interface TaskCardProps {
  task: Task;
  members: Member[];
  onAssign: (taskId: number, assigneeId: number | null) => void;
}

export default function TaskCard({ task, members, onAssign }: TaskCardProps) {
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition, 
    isDragging 
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    boxShadow: isDragging ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' : 'none',
  };

  const assignee = members.find(m => m.id === task.assignee_id);

  const handleAssignmentChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newAssigneeId = e.target.value === 'unassigned' ? null : parseInt(e.target.value, 10);
    onAssign(task.id, newAssigneeId);
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners} 
      className="bg-white p-4 mb-3 rounded-lg shadow touch-none border-l-4 border-transparent hover:border-indigo-500 cursor-grab active:cursor-grabbing"
    >
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
          <div 
            className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold" 
            title={assignee.username}
          >
            {assignee.username.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}
'use client';

import { useState, FormEvent } from 'react';
import axios from 'axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Define the types needed for this component
type TaskStatus = "To Do" | "In Progress" | "Done";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  column: TaskStatus; // To know which column the task should be added to
  // We don't need a setTasks callback because the real-time socket will handle the update
}

export default function CreateTaskModal({ isOpen, onClose, projectId, column }: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) {
        toast.error("Task title cannot be empty.");
        return;
    }
    setIsCreating(true);
    try {
        const token = localStorage.getItem('token');
        await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/api/tasks`,
            {
                title,
                description,
                projectId,
                status: column,
            },
            { headers: { 'x-auth-token': token } }
        );
        // The backend will broadcast 'task_created', so we don't need to update state here.
        toast.success("Task created successfully!");
        setTitle('');
        setDescription('');
        onClose();
    } catch (error) {
        toast.error("Failed to create task.");
        console.error("Failed to create task", error);
    } finally {
        setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a New Task</DialogTitle>
          <DialogDescription>
            Add a new task to the &quot;{column}&quot; column.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Design the homepage mockup"
              required
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details about the task..."
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
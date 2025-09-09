'use client';

import { useState, FormEvent } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { cn } from '@/lib/utils'; // Make sure you have this utility for class names

// --- Component Imports ---
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';

// --- Service Imports ---
import { createTask } from '../services/api'; // Import your centralized API function

// --- Type Definitions ---
type TaskStatus = "To Do" | "In Progress" | "Done";
interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  column: TaskStatus;
}

export default function CreateTaskModal({ isOpen, onClose, projectId, column }: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // --- FIX: Add state for the new date fields ---
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Task title cannot be empty.");
      return;
    }
    setIsCreating(true);
    try {
      // --- FIX: Pass all new fields to the createTask API function ---
      await createTask({
        title,
        description,
        projectId,
        status: column,
        start_date: startDate,
        due_date: dueDate,
      });
      
      toast.success("Task created successfully!");
      // Reset all form fields
      setTitle('');
      setDescription('');
      setStartDate(undefined);
      setDueDate(undefined);
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
          {/* --- Title and Description (No Change) --- */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Design the homepage mockup" required />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add more details about the task..." />
          </div>

          {/* --- FIX: Add Start Date and Due Date Pickers --- */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <DayPicker mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <DayPicker mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
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
'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { cn } from '@/lib/utils';

// --- UI & Icon Imports ---
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { Send, Trash2, Calendar, User, Tag, Paperclip, CalendarIcon } from 'lucide-react';

// --- Service Imports ---
import { getTaskDetails, updateTask, deleteTask } from '../services/api';

// --- Type Definitions (Fully Restored) ---
interface Comment { id: number; content: string; created_at: string; author_name: string; }
interface Attachment { id: number; file_name: string; file_url: string; uploaded_at: string; }
interface Label { id: number; name: string; color: string; }
interface TaskDetails {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  start_date: string | null;
  due_date: string | null;
  assignee_name: string | null;
  comments: Comment[];
  attachments: Attachment[];
  labels: Label[];
}

interface TaskDetailsModalProps {
  taskId: number | null;
  onClose: () => void;
}

export default function TaskDetailsModal({ taskId, onClose }: TaskDetailsModalProps) {
  const [task, setTask] = useState<TaskDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [dueDate, setDueDate] = useState<Date | undefined>();

  useEffect(() => {
    const fetchDetails = async () => {
      if (!taskId) return;
      setIsLoading(true);
      try {
        const res = await getTaskDetails(taskId);
        const taskData = res.data;
        setTask(taskData);
        setTitle(taskData.title);
        setDescription(taskData.description || '');
        setStartDate(taskData.start_date ? new Date(taskData.start_date) : undefined);
        setDueDate(taskData.due_date ? new Date(taskData.due_date) : undefined);
      } catch (error) {
        toast.error("Failed to load task details.");
        console.error(error);
        onClose();
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [taskId, onClose]);

  const handleSaveChanges = async () => {
    if (!taskId) return;
    try {
      await updateTask(taskId, {
        title,
        description,
        start_date: startDate,
        due_date: dueDate,
      });
      toast.success("Task updated successfully!");
      onClose();
    } catch (error) {
      toast.error("Failed to save changes.");
      console.error(error);
    }
  };

  const handleDeleteTask = async () => {
      if (!taskId) return;
      try {
          await deleteTask(taskId);
          toast.success("Task deleted.");
          onClose();
      } catch (error) {
          toast.error("Failed to delete task.");
          console.error(error);
      }
  };

  if (isLoading || !task) {
    return (
      <Dialog open={!!taskId} onOpenChange={onClose}>
        <DialogContent><p>Loading...</p></DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={!!taskId} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <div className="grid grid-cols-3 gap-8 h-full">
          <div className="col-span-2 pr-8 border-r overflow-y-auto">
            <Input className="text-2xl font-bold border-none shadow-none focus-visible:ring-0 p-0 h-auto" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Textarea className="text-sm text-muted-foreground mt-4 border-none shadow-none focus-visible:ring-0 p-0 h-auto" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add a description..." />
            <div className="mt-6"><Button onClick={handleSaveChanges}>Save Changes</Button></div>
            <div className="mt-8">
              <h4 className="font-semibold mb-4">Comments</h4>
              <div className="space-y-4">
                {task.comments.map(comment => (<div key={comment.id} className="text-sm">{comment.author_name}: {comment.content}</div>))}
              </div>
            </div>
          </div>
          <aside className="col-span-1 space-y-6">
            <div><h4 className="font-semibold mb-2">Status</h4><p>{task.status}</p></div>
            <div><h4 className="font-semibold mb-2 flex items-center"><User className="w-4 h-4 mr-2"/>Assignee</h4><p>{task.assignee_name || 'Unassigned'}</p></div>
            <div><h4 className="font-semibold mb-2 flex items-center"><Tag className="w-4 h-4 mr-2"/>Priority</h4><p>{task.priority || 'None'}</p></div>
            <div>
              <h4 className="font-semibold mb-2 flex items-center"><Calendar className="w-4 h-4 mr-2"/>Start Date</h4>
              <Popover>
                <PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{startDate ? format(startDate, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger>
                <PopoverContent className="w-auto p-0"><DayPicker mode="single" selected={startDate} onSelect={setStartDate} /></PopoverContent>
              </Popover>
            </div>
            <div>
              <h4 className="font-semibold mb-2 flex items-center"><Calendar className="w-4 h-4 mr-2"/>Due Date</h4>
              <Popover>
                <PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger>
                <PopoverContent className="w-auto p-0"><DayPicker mode="single" selected={dueDate} onSelect={setDueDate} /></PopoverContent>
              </Popover>
            </div>
            <div><h4 className="font-semibold mb-3 flex items-center"><Paperclip className="w-4 h-4 mr-3"/>Attachments</h4><p className="text-xs text-muted-foreground">{task.attachments.length > 0 ? `${task.attachments.length} file(s)` : 'No attachments yet'}</p></div>
            <div className="pt-6 border-t">
              <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="destructive" className="w-full"><Trash2 className="w-4 h-4 mr-2" />Delete Task</Button></AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will mark the task as deleted but it can be recovered later. Are you sure you want to proceed?</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteTask}>Continue & Delete</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
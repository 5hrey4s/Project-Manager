'use client';

import { useEffect, useState, FormEvent } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { Trash2, Calendar as CalendarIcon, User, Tag, Paperclip, Flag, Send } from 'lucide-react';

// --- Service Imports ---
import { getTaskDetails, updateTask, deleteTask, addComment } from '../services/api';
import { useAuth } from '../context/AuthContext';

// --- Type Definitions ---
interface Comment { id: number; content: string; created_at: string; author_name: string; }
interface Attachment { id: number; file_name: string; file_url: string; uploaded_at: string; }
interface Label { id: number; name: string; color: string; }
interface TaskDetails {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent' | null;
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
  const { user } = useAuth();
  const [task, setTask] = useState<TaskDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- State for ALL editable fields ---
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskDetails['priority']>('Medium');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (!taskId) { setTask(null); return; }

    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        const response = await getTaskDetails(taskId);
        setTask(response.data);
        setTitle(response.data.title);
        setDescription(response.data.description || '');
        setPriority(response.data.priority || 'Medium');
        setStartDate(response.data.start_date ? new Date(response.data.start_date) : undefined);
        setDueDate(response.data.due_date ? new Date(response.data.due_date) : undefined);
      } catch (error) {
        toast.error("Failed to load task details.");
        console.error("Fetch task details error:", error);
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
        priority,
        start_date: startDate,
        due_date: dueDate,
      });
      toast.success("Task updated successfully!");
      onClose();
    } catch (error) {
      toast.error("Failed to save changes.");
      console.error("Save task error:", error);
    }
  };

  const handleDelete = async () => {
    if (!taskId) return;
    try {
      await deleteTask(taskId);
      toast.success("Task deleted!");
      onClose();
    } catch (error) {
      toast.error("Failed to delete task.");
      console.error("Delete task error:", error);
    }
  };


  const handleSubmitComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!taskId || !newComment.trim()) return;
    try {
      await addComment(taskId, newComment);
      setNewComment("");
      // Real-time update will be handled by the socket listener on the main page
    } catch (error) {
      toast.error("Failed to post comment.");
    }
  };

  return (
    <Dialog open={!!taskId} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        {isLoading ? ( <p>Loading...</p> ) : task ? (
          <>
            <div className="flex-shrink-0">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="flex-grow grid grid-cols-3 gap-8 mt-4 overflow-hidden">
              <div className="col-span-2 pr-8 border-r overflow-y-auto">
                {/* --- RESTORED: Comments Section with Input Form --- */}
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Comments</h4>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-2 mb-4">
                    {task.comments?.map(comment => (
                      <div key={comment.id}><strong>{comment.author_name}:</strong> {comment.content}</div>
                    ))}
                  </div>
                  <form onSubmit={handleSubmitComment} className="flex gap-2">
                    <Input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..."/>
                    <Button type="submit" size="icon" disabled={!newComment.trim()}><Send className="w-4 h-4" /></Button>
                  </form>
                </div>
              </div>

              <aside className="col-span-1 space-y-4">
                <div><h4 className="font-semibold text-sm mb-1">Status</h4><Badge variant="outline">{task.status}</Badge></div>
                <div><h4 className="font-semibold text-sm mb-1 flex items-center"><User className="w-4 h-4 mr-2"/>Assignee</h4><p>{task.assignee_name || 'Unassigned'}</p></div>
                
                <div>
                  <h4 className="font-semibold text-sm mb-1 flex items-center"><Flag className="w-4 h-4 mr-2"/>Priority</h4>
                  {/* --- THIS IS THE FIX --- */}
                  <Select value={priority || 'Medium'} onValueChange={(value: string) => setPriority(value as TaskDetails['priority'])}>
                    <SelectTrigger><SelectValue placeholder="Set priority" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Urgent">Urgent</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm mb-1 flex items-center"><CalendarIcon className="w-4 h-4 mr-2"/>Start Date</h4>
                  <Popover>
                    <PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{startDate ? format(startDate, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><DayPicker mode="single" selected={startDate} onSelect={setStartDate} /></PopoverContent>
                  </Popover>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1 flex items-center"><CalendarIcon className="w-4 h-4 mr-2"/>Due Date</h4>
                  <Popover>
                    <PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><DayPicker mode="single" selected={dueDate} onSelect={setDueDate} /></PopoverContent>
                  </Popover>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-1 flex items-center"><Tag className="w-4 h-4 mr-2"/>Labels</h4>
                  <div className="flex flex-wrap gap-1">
                    {task.labels && task.labels.length > 0 
                      ? task.labels.map(label => <Badge key={label.id} variant="secondary">{label.name}</Badge>) 
                      : <p className="text-xs text-muted-foreground">No labels</p>}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm mb-1 flex items-center"><Paperclip className="w-4 h-4 mr-2"/>Attachments</h4>
                  <p className="text-xs text-muted-foreground">{task.attachments && task.attachments.length > 0 ? `${task.attachments.length} file(s)` : 'No attachments'}</p>
                </div>
              </aside>
            </div>
            
            <div className="flex-shrink-0 pt-4 border-t flex justify-between items-center">
              <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="w-4 h-4 mr-2" />Delete Task</Button></AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will mark the task as deleted.</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>Continue & Delete</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button size="sm" onClick={handleSaveChanges}>Save Changes</Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
'use client';

import { useEffect, useState, FormEvent } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

// --- UI & Icon Imports ---
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Toaster, toast } from 'sonner';
import { Send, Trash2, Calendar, User, Tag, Paperclip, GripVertical } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// --- Type Definitions for Clarity ---
interface Comment { id: number; content: string; created_at: string; author_name: string; }
interface Attachment { id: number; file_name: string; file_url: string; uploaded_at: string; }
interface Label { id: number; name: string; color: string; }
interface TaskDetails {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  assignee_name: string | null;
  comments: Comment[];
  attachments: Attachment[];
  labels: Label[];
}

interface TaskDetailsModalProps {
  taskId: number | null;
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  onTaskDeleted: (taskId: number) => void; // Callback to update the Kanban board
}

export default function TaskDetailsModal({ taskId, isOpen, onClose, projectId, onTaskDeleted }: TaskDetailsModalProps) {
  const { user } = useAuth();
  const [taskDetails, setTaskDetails] = useState<TaskDetails | null>(null);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !taskId) return;

    // --- Real-time Setup ---
    const socket: Socket = io(process.env.NEXT_PUBLIC_API_URL!);
    socket.emit('join_project', `project-${projectId}`);
    socket.on('new_comment', (data: { taskId: number; comment: Comment }) => {
      if (data.taskId === taskId) {
        setTaskDetails(prev => prev ? { ...prev, comments: [...prev.comments, data.comment] } : null);
      }
    });

    // --- Data Fetching ---
    const fetchTaskDetails = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${taskId}/details`, { headers: { 'x-auth-token': token } });
        setTaskDetails(response.data);
      } catch (error) {
        console.error('Failed to fetch task details', error);
        toast.error("Failed to load task details.");
      } finally {
        setLoading(false);
      }
    };
    fetchTaskDetails();

    // --- Cleanup ---
    return () => {
      socket.emit('leave_project', `project-${projectId}`);
      socket.disconnect();
    };
  }, [isOpen, taskId, projectId]);

  // --- Event Handlers ---
  const handleCommentSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newComment.trim() || !taskId) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${taskId}/comments`, { content: newComment }, { headers: { 'x-auth-token': token } });
      setNewComment('');
    } catch (error) {
      toast.error(`Failed to send comment: ${error}`);
    }
  };

  const handleDeleteTask = async () => {
    if (!taskId) return;
    try {
        const token = localStorage.getItem('token');
        await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${taskId}`, { headers: { 'x-auth-token': token } });
        toast.success("Task deleted successfully!");
        onTaskDeleted(taskId); // Update the UI on the project page
        onClose();
    } catch (error) {
        toast.error(`Failed to delete task:${error}`);
    }
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0">
          {loading && <div className="flex items-center justify-center h-full"><p>Loading task...</p></div>}
          {!loading && taskDetails && (
            <>
              <DialogHeader className="p-6 border-b">
                <DialogTitle className="text-2xl font-bold">{taskDetails.title}</DialogTitle>
                <DialogDescription>
                  Status: <Badge variant="outline">{taskDetails.status}</Badge>
                </DialogDescription>
              </DialogHeader>

              <div className="grid md:grid-cols-3 gap-0 overflow-hidden flex-grow">
                {/* Main Content (Left Side) */}
                <div className="md:col-span-2 p-6 flex flex-col h-full">
                  <div className="flex-grow overflow-y-auto pr-4">
                    <h3 className="font-semibold mb-2 text-lg">Description</h3>
                    <div className="text-muted-foreground mb-8 prose dark:prose-invert max-w-none">{taskDetails.description || 'No description provided.'}</div>
                    
                    <h3 className="font-semibold mb-4 text-lg">Comments</h3>
                    <div className="space-y-6">
                      {taskDetails.comments.map(comment => (
                        <div key={comment.id} className="flex items-start gap-3">
                          <Avatar className="w-9 h-9"><AvatarFallback>{comment.author_name.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                          <div>
                            <p className="font-semibold text-sm">{comment.author_name}</p>
                            <div className="bg-muted p-3 rounded-lg text-sm mt-1">{comment.content}</div>
                            <p className="text-xs text-muted-foreground mt-1">{new Date(comment.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-auto pt-4 border-t">
                    <form onSubmit={handleCommentSubmit} className="flex items-center gap-2">
                      <Avatar className="w-9 h-9"><AvatarFallback>{user?.username.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                      <Input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Write a comment..." autoComplete="off" />
                      <Button type="submit" size="icon" disabled={!newComment.trim()}><Send className="w-4 h-4" /></Button>
                    </form>
                  </div>
                </div>

                {/* Sidebar (Right Side) */}
                <aside className="col-span-1 border-l bg-muted/30 p-6 space-y-6 overflow-y-auto">
                  <h3 className="font-semibold text-lg">Details</h3>
                  <div className="space-y-4 text-sm">
                    <div className="flex items-center"><User className="w-4 h-4 mr-3 text-muted-foreground" /><span className="font-medium">Assignee:</span><span className="ml-auto">{taskDetails.assignee_name || 'Unassigned'}</span></div>
                    <div className="flex items-center"><GripVertical className="w-4 h-4 mr-3 text-muted-foreground" /><span className="font-medium">Priority:</span><span className="ml-auto">{taskDetails.priority}</span></div>
                    <div className="flex items-center"><Calendar className="w-4 h-4 mr-3 text-muted-foreground" /><span className="font-medium">Due Date:</span><span className="ml-auto">{taskDetails.due_date ? new Date(taskDetails.due_date).toLocaleDateString() : 'None'}</span></div>
                  </div>
                  
                  <div>
                      <h4 className="font-semibold mb-3 flex items-center"><Tag className="w-4 h-4 mr-3 text-muted-foreground" />Labels</h4>
                      <div className="flex flex-wrap gap-2">
                          {taskDetails.labels.length > 0 ? taskDetails.labels.map(label => (<Badge key={label.id} style={{ backgroundColor: label.color, color: '#fff' }}>{label.name}</Badge>)) : <p className="text-xs text-muted-foreground">No labels</p>}
                      </div>
                  </div>
                  
                  <div>
                      <h4 className="font-semibold mb-3 flex items-center"><Paperclip className="w-4 h-4 mr-3 text-muted-foreground" />Attachments</h4>
                      <p className="text-xs text-muted-foreground">No attachments yet</p>
                  </div>

                  <div className="pt-6 border-t">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full"><Trash2 className="w-4 h-4 mr-2" />Delete Task</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>This action cannot be undone. This will permanently delete the task and all of its associated data from the servers.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteTask}>Continue & Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </aside>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
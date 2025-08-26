'use client';

import { useEffect, useState, FormEvent } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Send } from 'lucide-react';

// --- Define specific types to replace 'any' ---
interface Comment {
  id: number;
  content: string;
  created_at: string;
  author_name: string;
}

interface Attachment {
    id: number;
    file_name: string;
    file_url: string;
    uploaded_at: string;
}

interface Label {
  id: number;
  name: string;
  color: string;
}

// --- Use the new types in the main interface ---
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
}

export default function TaskDetailsModal({ taskId, isOpen, onClose, projectId }: TaskDetailsModalProps) {
  const { user } = useAuth();
  const [taskDetails, setTaskDetails] = useState<TaskDetails | null>(null);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !taskId) {
      return;
    }

    const socket: Socket = io(process.env.NEXT_PUBLIC_API_URL!);
    socket.emit('join_project', `project-${projectId}`);

    socket.on('new_comment', (data: { taskId: number; comment: Comment }) => {
      if (data.taskId === taskId) {
        setTaskDetails(prevDetails => {
          if (!prevDetails) return null;
          return {
            ...prevDetails,
            comments: [...prevDetails.comments, data.comment]
          };
        });
      }
    });

    const fetchTaskDetails = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${taskId}/details`,
          { headers: { 'x-auth-token': token } }
        );
        setTaskDetails(response.data);
      } catch (error) {
        console.error('Failed to fetch task details', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTaskDetails();

    return () => {
      socket.emit('leave_project', `project-${projectId}`);
      socket.disconnect();
    };
  }, [isOpen, taskId, projectId]);

  const handleCommentSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newComment.trim() || !taskId) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${taskId}/comments`,
        { content: newComment },
        { headers: { 'x-auth-token': token } }
      );
      // --- FIX: Clear the input field after successful submission ---
      setNewComment('');
    } catch (error) {
      console.error('Failed to post comment', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        {loading && <p className="text-center p-10">Loading task details...</p>}
        {!loading && taskDetails && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">{taskDetails.title}</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 overflow-hidden flex-grow mt-4">
              
              {/* Main content area */}
              <div className="md:col-span-2 flex flex-col h-full">
                <div className="flex-grow overflow-y-auto pr-4">
                  <h3 className="font-semibold mb-2 text-lg">Description</h3>
                  <p className="text-muted-foreground mb-6">{taskDetails.description || 'No description provided.'}</p>
                  
                  <h3 className="font-semibold mb-4 text-lg">Comments</h3>
                  <div className="space-y-4">
                    {taskDetails.comments.map(comment => (
                      <div key={comment.id} className="flex items-start gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>{comment.author_name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm">{comment.author_name}</p>
                          <div className="bg-muted p-3 rounded-lg text-sm">
                            {comment.content}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(comment.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comment form */}
                <div className="mt-auto pt-4 border-t">
                  <form onSubmit={handleCommentSubmit} className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                        <AvatarFallback>{user?.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <Input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      autoComplete="off"
                    />
                    <Button type="submit" size="icon" disabled={!newComment.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </div>

              {/* Right Sidebar */}
              <aside className="col-span-1 space-y-6 border-l pl-6">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Status</h4>
                  <Badge>{taskDetails.status}</Badge>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">Priority</h4>
                  <Badge variant={taskDetails.priority === 'High' || taskDetails.priority === 'Urgent' ? 'destructive' : 'secondary'}>
                    {taskDetails.priority}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">Assignee</h4>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{taskDetails.assignee_name?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{taskDetails.assignee_name || 'Unassigned'}</span>
                  </div>
                </div>
                <div>
                    <h4 className="font-semibold text-sm mb-2">Labels</h4>
                    <div className="flex flex-wrap gap-1">
                        {taskDetails.labels.map(label => (
                            <Badge key={label.id} style={{ backgroundColor: label.color, color: '#fff' }}>{label.name}</Badge>
                        ))}
                    </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
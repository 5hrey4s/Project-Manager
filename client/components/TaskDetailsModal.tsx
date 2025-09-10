'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { getTaskDetails, deleteTask } from '../services/api';

// --- Type Definitions ---
interface Comment { id: number; content: string; created_at: string; author_name: string; }
// FIX: Define specific types for attachments and labels instead of 'any'
interface Attachment { id: number; file_name: string; file_url: string; uploaded_at: string; }
interface Label { id: number; name: string; color: string; }

interface TaskDetails {
  id: number;
  title: string;
  description: string | null;
  status: string;
  comments: Comment[];
  attachments: Attachment[]; // Use the specific type
  labels: Label[];      // Use the specific type
}

interface TaskDetailsModalProps {
  taskId: number | null;
  onClose: () => void;
}

export default function TaskDetailsModal({ taskId, onClose }: TaskDetailsModalProps) {
  const [task, setTask] = useState<TaskDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!taskId) {
      setTask(null);
      return;
    }

    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        const response = await getTaskDetails(taskId);
        setTask(response.data);
      } catch (error) { // FIX: Use the 'error' variable for logging
        toast.error("Failed to load task details.");
        console.error("Fetch task details error:", error);
        onClose();
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [taskId, onClose]);

  const handleDelete = async () => {
    if (!taskId) return;
    try {
      await deleteTask(taskId);
      toast.success("Task deleted!");
      onClose();
    } catch (error) { // FIX: Use the 'error' variable for logging
      toast.error("Failed to delete task.");
      console.error("Delete task error:", error);
    }
  };

  return (
    <Dialog open={!!taskId} onOpenChange={onClose}>
      <DialogContent>
        {isLoading ? (
          <p>Loading details...</p>
        ) : task ? (
          <>
            <DialogHeader>
              <DialogTitle>{task.title}</DialogTitle>
              <DialogDescription>{task.description || "No description provided."}</DialogDescription>
            </DialogHeader>
            
            <div className="mt-4">
                <h3 className="font-semibold my-2">Comments</h3>
                {task.comments && task.comments.length > 0 ? (
                    task.comments.map(comment => (
                        <div key={comment.id} className="text-sm mb-2 p-2 bg-muted/50 rounded-md">
                            <strong>{comment.author_name}:</strong> {comment.content}
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground">No comments yet.</p>
                )}
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="mt-6 w-full sm:w-auto">
                  <Trash2 className="w-4 h-4 mr-2" />Delete Task
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will mark the task as deleted. This action can be undone by an administrator.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Continue & Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : (
          <p>No task details found.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
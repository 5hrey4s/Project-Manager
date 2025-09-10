"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import { format } from "date-fns"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"
import { cn } from "@/lib/utils"
import axios from "axios"; // Import axios for direct Supabase upload
import { supabase } from "../lib/supabaseClient" // <-- THIS IS THE FIX

// --- UI & Icon Imports ---
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { Trash2, CalendarIcon, User, Tag, Paperclip, Flag, Send, Clock, MessageSquare, X, Loader2, Upload } from "lucide-react"

// --- Service Imports ---
import { getTaskDetails, updateTask, deleteTask, addComment, deleteAttachment, addAttachmentRecord, getAttachmentUploadUrl } from "../services/api"
import { useAuth } from "../context/AuthContext"

// --- Type Definitions ---
interface Comment {
  id: number
  content: string
  created_at: string
  author_name: string
}
interface Attachment { id: number; file_name: string; file_url: string; user_id: number; }

interface Label {
  id: number
  name: string
  color: string
}
interface TaskDetails {
  id: number
  title: string
  description: string | null
  status: string
  priority: "Low" | "Medium" | "High" | "Urgent" | null
  start_date: string | null
  due_date: string | null
  assignee_name: string | null
  comments: Comment[]
  attachments: Attachment[]
  labels: Label[]
}

interface TaskDetailsModalProps {
  taskId: number | null
  onClose: () => void
}

export default function TaskDetailsModal({ taskId, onClose }: TaskDetailsModalProps) {
  const { user } = useAuth()
  const [task, setTask] = useState<TaskDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // --- State for ALL editable fields ---
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<TaskDetails["priority"]>("Medium")
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [dueDate, setDueDate] = useState<Date | undefined>()
  const [newComment, setNewComment] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (!taskId) {
      setTask(null)
      return
    }

    const fetchDetails = async () => {
      setIsLoading(true)
      try {
        const response = await getTaskDetails(taskId)
        setTask(response.data)
        setTitle(response.data.title)
        setDescription(response.data.description || "")
        setPriority(response.data.priority || "Medium")
        setStartDate(response.data.start_date ? new Date(response.data.start_date) : undefined)
        setDueDate(response.data.due_date ? new Date(response.data.due_date) : undefined)
      } catch (error) {
        toast.error("Failed to load task details.")
        console.error("Fetch task details error:", error)
        onClose()
      } finally {
        setIsLoading(false)
      }
    }
    fetchDetails()
  }, [taskId, onClose])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !taskId) return;
    setIsUploading(true);

    try {
      // 1. Get a signed URL from our backend
      const { data: presignedData } = await getAttachmentUploadUrl(taskId, {
        fileName: selectedFile.name,
        fileType: selectedFile.type,
      });

      // 2. Upload the file directly to Supabase Storage using the signed URL
      await axios.put(presignedData.url, selectedFile, {
        headers: { 'Content-Type': selectedFile.type },
      });

      // 3. Create the public URL for the file
      const { data: { publicUrl } } = supabase.storage.from('project-files').getPublicUrl(presignedData.path);
      
      // 4. Save the attachment metadata to our database
      await addAttachmentRecord(taskId, {
        file_name: selectedFile.name,
        file_url: publicUrl,
        file_type: selectedFile.type,
        file_size: selectedFile.size,
        file_path: presignedData.path, // Store the path for easy deletion
      });

      toast.success("File uploaded successfully!");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      toast.error("File upload failed.");
      console.error("File upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    try {
      await deleteAttachment(attachmentId);
      toast.success("Attachment deleted.");
    } catch (error) {
      toast.error("Failed to delete attachment.");
      console.error(`Failed to delete attachment.: ${error}`)
    }
  };
  
  const handleSaveChanges = async () => {
    if (!taskId) return
    try {
      await updateTask(taskId, {
        title,
        description,
        priority,
        start_date: startDate,
        due_date: dueDate,
      })
      toast.success("Task updated successfully!")
      onClose()
    } catch (error) {
      toast.error("Failed to save changes.")
      console.error("Save task error:", error)
    }
  }

  const handleDelete = async () => {
    if (!taskId) return
    try {
      await deleteTask(taskId)
      toast.success("Task deleted!")
      onClose()
    } catch (error) {
      toast.error("Failed to delete task.")
      console.error("Delete task error:", error)
    }
  }

  const handleSubmitComment = async (e: FormEvent) => {
    e.preventDefault()
    if (!taskId || !newComment.trim()) return
    try {
      await addComment(taskId, newComment)
      setNewComment("")
      // Real-time update will be handled by the socket listener on the main page
    } catch (error) {
      toast.error("Failed to post comment.")
      console.error(`Failed to post comment.: ${error}`)
    }
  }

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case "Urgent":
        return "destructive"
      case "High":
        return "destructive"
      case "Medium":
        return "default"
      case "Low":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getPriorityIcon = (priority: string | null) => {
    switch (priority) {
      case "Urgent":
        return "🔴"
      case "High":
        return "🟠"
      case "Medium":
        return "🟡"
      case "Low":
        return "🟢"
      default:
        return "⚪"
    }
  }

  return (
    <Dialog open={!!taskId} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] w-[95vw] p-0 gap-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : task ? (
          <div className="flex flex-col h-full max-h-[95vh]">
            <DialogHeader className="px-4 sm:px-6 py-4 border-b bg-muted/30 flex-shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-lg sm:text-xl font-semibold border-none bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                    placeholder="Task title..."
                  />
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant={getPriorityColor(priority)} className="text-xs">
                      {getPriorityIcon(priority)} {priority || "Medium"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {task.status}
                    </Badge>
                    {task.assignee_name && (
                      <Badge variant="secondary" className="text-xs">
                        <User className="w-3 h-3 mr-1" />
                        {task.assignee_name}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-hidden min-h-0">
              <div className="flex flex-col lg:grid lg:grid-cols-3 h-full">
                {/* Main Content Area */}
                <div className="lg:col-span-2 flex flex-col min-h-0 order-2 lg:order-1">
                  <ScrollArea className="flex-1 h-full">
                    <div className="p-4 sm:p-6 space-y-6">
                      {/* Description */}
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                        <Textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Add a description..."
                          className="min-h-[100px] sm:min-h-[120px] resize-none"
                        />
                      </div>

                      <Separator />

                      {/* Comments Section */}
                      <div className="flex flex-col min-h-0">
                        <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                          <MessageSquare className="w-4 h-4" />
                          <h3 className="text-sm font-medium">Comments</h3>
                          <Badge variant="secondary" className="text-xs">
                            {task.comments?.length || 0}
                          </Badge>
                        </div>

                        <div className="flex-1 min-h-0 mb-4">
                          <ScrollArea className="h-[300px] sm:h-[400px] pr-4">
                            <div className="space-y-3">
                              {task.comments?.length > 0 ? (
                                task.comments.map((comment) => (
                                  <Card key={comment.id} className="border-l-4 border-l-primary/20">
                                    <CardContent className="p-3 sm:p-4">
                                      <div className="flex items-start justify-between mb-2 gap-2">
                                        <span className="font-medium text-sm truncate">{comment.author_name}</span>
                                        <span className="text-xs text-muted-foreground flex-shrink-0">
                                          {format(new Date(comment.created_at), "MMM d, yyyy")}
                                        </span>
                                      </div>
                                      <p className="text-sm text-muted-foreground break-words">{comment.content}</p>
                                    </CardContent>
                                  </Card>
                                ))
                              ) : (
                                <div className="flex items-center justify-center h-32">
                                  <p className="text-sm text-muted-foreground text-center">
                                    No comments yet. Start the conversation!
                                  </p>
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </div>

                        {/* Add Comment Form */}
                        <form onSubmit={handleSubmitComment} className="flex gap-2 flex-shrink-0">
                          <Input
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            className="flex-1"
                          />
                          <Button type="submit" size="icon" disabled={!newComment.trim()} className="flex-shrink-0">
                            <Send className="w-4 h-4" />
                          </Button>
                        </form>
                      </div>
                    </div>
                  </ScrollArea>
                </div>

                <div className="border-l-0 lg:border-l bg-muted/20 border-b lg:border-b-0 order-1 lg:order-2">
                  <ScrollArea className="h-[300px] lg:h-full">
                    <div className="p-4 sm:p-6 space-y-4 lg:space-y-6">
                      {/* Priority */}
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                          <Flag className="w-4 h-4 mr-2" />
                          Priority
                        </label>
                        <Select
                          value={priority || "Medium"}
                          onValueChange={(value: string) => setPriority(value as TaskDetails["priority"])}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Set priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Urgent">🔴 Urgent</SelectItem>
                            <SelectItem value="High">🟠 High</SelectItem>
                            <SelectItem value="Medium">🟡 Medium</SelectItem>
                            <SelectItem value="Low">🟢 Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Dates */}
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            Start Date
                          </label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal text-xs sm:text-sm",
                                  !startDate && "text-muted-foreground",
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{startDate ? format(startDate, "PPP") : "Pick a date"}</span>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <DayPicker mode="single" selected={startDate} onSelect={setStartDate} />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            Due Date
                          </label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal text-xs sm:text-sm",
                                  !dueDate && "text-muted-foreground",
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{dueDate ? format(dueDate, "PPP") : "Pick a date"}</span>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <DayPicker mode="single" selected={dueDate} onSelect={setDueDate} />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      {/* Labels */}
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                          <Tag className="w-4 h-4 mr-2" />
                          Labels
                        </label>
                        <div className="flex flex-wrap gap-1">
                          {task.labels && task.labels.length > 0 ? (
                            task.labels.map((label) => (
                              <Badge key={label.id} variant="secondary" className="text-xs">
                                {label.name}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-xs text-muted-foreground">No labels assigned</p>
                          )}
                        </div>
                      </div>

                      {/* Attachments */}
                                    {/* --- ATTACHMENTS SECTION --- */}
              <div>
                <h4 className="font-semibold text-sm mb-1 flex items-center"><Paperclip className="w-4 h-4 mr-2"/>Attachments</h4>
                <div className="max-h-32 overflow-y-auto space-y-2 pr-1">
                  {task.attachments?.map(att => (
                    <div key={att.id} className="text-xs flex items-center justify-between gap-2 p-1.5 bg-muted/50 rounded">
                      <a href={att.file_url} target="_blank" rel="noopener noreferrer" className="truncate hover:underline">{att.file_name}</a>
                      {user?.id === att.user_id && (
                        <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={() => handleDeleteAttachment(att.id)}>
                          <X className="w-3 h-3"/>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-2">
                  <Input type="file" ref={fileInputRef} onChange={handleFileSelect} className="text-xs h-8" />
                  {selectedFile && (
                    <Button onClick={handleFileUpload} disabled={isUploading} size="sm" className="w-full mt-2">
                      {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                      Upload &quot;{selectedFile.name.substring(0, 20)}...&quot;
                    </Button>
                  )}
                </div>
              </div>
 
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>

            <div className="border-t bg-muted/30 px-4 sm:px-6 py-4 flex-shrink-0">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive bg-transparent w-full sm:w-auto"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Task
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="w-[95vw] max-w-md">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Task</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this task? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                      <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive hover:bg-destructive/90 w-full sm:w-auto"
                      >
                        Delete Task
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <div className="flex gap-2 w-full sm:w-auto">
                  <Button variant="outline" size="sm" onClick={onClose} className="flex-1 sm:flex-none bg-transparent">
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveChanges} className="flex-1 sm:flex-none">
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useEffect, useState, type FormEvent } from "react"
import { format } from "date-fns"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"
import { cn } from "@/lib/utils"

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
import { Trash2, CalendarIcon, User, Tag, Paperclip, Flag, Send, Clock, MessageSquare, X } from "lucide-react"

// --- Service Imports ---
import { getTaskDetails, updateTask, deleteTask, addComment } from "../services/api"
import { useAuth } from "../context/AuthContext"

// --- Type Definitions ---
interface Comment {
  id: number
  content: string
  created_at: string
  author_name: string
}
interface Attachment {
  id: number
  file_name: string
  file_url: string
  uploaded_at: string
}
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
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 gap-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : task ? (
          <div className="flex flex-col h-full">
            <DialogHeader className="px-6 py-4 border-b bg-muted/30">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-xl font-semibold border-none bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                    placeholder="Task title..."
                  />
                  <div className="flex items-center gap-2 mt-2">
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
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
                {/* Main Content Area */}
                <div className="lg:col-span-2 flex flex-col">
                  <ScrollArea className="flex-1">
                    <div className="p-6 space-y-6">
                      {/* Description */}
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                        <Textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Add a description..."
                          className="min-h-[120px] resize-none"
                        />
                      </div>

                      <Separator />

                      {/* Comments Section */}
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <MessageSquare className="w-4 h-4" />
                          <h3 className="text-sm font-medium">Comments</h3>
                          <Badge variant="secondary" className="text-xs">
                            {task.comments?.length || 0}
                          </Badge>
                        </div>

                        {/* Comments List */}
                        <div className="space-y-3 mb-4">
                          {task.comments?.length > 0 ? (
                            task.comments.map((comment) => (
                              <Card key={comment.id} className="border-l-4 border-l-primary/20">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <span className="font-medium text-sm">{comment.author_name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {format(new Date(comment.created_at), "MMM d, yyyy")}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{comment.content}</p>
                                </CardContent>
                              </Card>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-8">
                              No comments yet. Start the conversation!
                            </p>
                          )}
                        </div>

                        {/* Add Comment Form */}
                        <form onSubmit={handleSubmitComment} className="flex gap-2">
                          <Input
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            className="flex-1"
                          />
                          <Button type="submit" size="icon" disabled={!newComment.trim()}>
                            <Send className="w-4 h-4" />
                          </Button>
                        </form>
                      </div>
                    </div>
                  </ScrollArea>
                </div>

                {/* Sidebar */}
                <div className="border-l bg-muted/20">
                  <ScrollArea className="h-full">
                    <div className="p-6 space-y-6">
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
                                  "w-full justify-start text-left font-normal",
                                  !startDate && "text-muted-foreground",
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
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
                                  "w-full justify-start text-left font-normal",
                                  !dueDate && "text-muted-foreground",
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
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
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                          <Paperclip className="w-4 h-4 mr-2" />
                          Attachments
                        </label>
                        <div className="text-xs text-muted-foreground">
                          {task.attachments && task.attachments.length > 0
                            ? `${task.attachments.length} file(s) attached`
                            : "No attachments"}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>

            <div className="border-t bg-muted/30 px-6 py-4">
              <div className="flex items-center justify-between">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive bg-transparent"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Task
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Task</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this task? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                        Delete Task
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveChanges}>
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

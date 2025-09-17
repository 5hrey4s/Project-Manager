"use client"

import type React from "react"

import { useEffect, useRef, useState, type FormEvent } from "react"
import { format } from "date-fns"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"
import { cn } from "@/lib/utils"

// --- UI & Icon Imports ---
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  Trash2,
  CalendarIcon,
  User,
  Tag,
  Paperclip,
  Flag,
  Send,
  Clock,
  MessageSquare,
  X,
  Upload,
  Download,
  FileText,
  ImageIcon,
  File,
  ChevronRight,
  Settings,Github
} from "lucide-react"

// --- Service Imports ---
import { getTaskDetails, updateTask, deleteTask, addComment, linkTaskToGithub } from "../services/api"
// import { useAuth } from "../context/AuthContext"

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
    github_links: GithubLink[]; // <-- Add this

}

interface TaskDetailsModalProps {
  taskId: number | null
  onClose: () => void
}

interface GithubLink { id: number; github_item_url: string; }


export default function TaskDetailsModal({ taskId, onClose }: TaskDetailsModalProps) {
  // const { user } = useAuth()
  const [task, setTask] = useState<TaskDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // --- State for ALL editable fields ---
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<TaskDetails["priority"]>("Medium")
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [dueDate, setDueDate] = useState<Date | undefined>()
  const [newComment, setNewComment] = useState("")

  const [githubPrUrl, setGithubPrUrl] = useState("");

  const handleLinkToGithub = async () => {
        if (!taskId || !githubPrUrl.trim()) return;
        try {
            await linkTaskToGithub(taskId, githubPrUrl);
            toast.success("Task successfully linked to Pull Request!");
            setGithubPrUrl("");
            // You'll need a way to refetch task details to show the new link instantly
        } catch (error) {
            toast.error("Failed to link Pull Request.");
            console.error(`Failed to link Pull Request: ${error}`);
        }
    };
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
      console.error(`Failed to post comment:${error}`)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0])
    }
  }

  const handleFileUpload = async () => {
    if (!selectedFile || !taskId) return
    setIsUploading(true)
    try {
      // File upload logic would go here
      toast.success("File uploaded successfully!")
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    } catch (error) {
      toast.error("File upload failed.")     
       console.error(`File upload failed:${error}`)

    } finally {
      setIsUploading(false)
    }
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase()
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")) {
      return <ImageIcon className="w-4 h-4" />
    }
    if (["pdf", "doc", "docx", "txt"].includes(extension || "")) {
      return <FileText className="w-4 h-4" />
    }
    return <File className="w-4 h-4" />
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
      <DialogContent className="max-w-[98vw] max-h-[95vh] w-[98vw] h-[95vh] p-0 gap-0 flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : task ? (
          <div className="flex flex-col h-full">
            <DialogHeader className="px-4 sm:px-6 py-4 border-b bg-gradient-to-r from-background via-muted/20 to-background flex-shrink-0">
              <DialogTitle className="sr-only">Task Details: {task.title}</DialogTitle>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-3">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-xl font-semibold border-none bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 text-balance"
                    placeholder="Task title..."
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={getPriorityColor(priority)} className="text-xs px-3 py-1">
                      {getPriorityIcon(priority)} {priority || "Medium"}
                    </Badge>
                    <Badge variant="outline" className="text-xs px-3 py-1">
                      {task.status}
                    </Badge>
                    {task.assignee_name && (
                      <Badge variant="secondary" className="text-xs px-3 py-1">
                        <User className="w-3 h-3 mr-1" />
                        <span className="truncate max-w-32">{task.assignee_name}</span>
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="hidden lg:flex h-9 w-9"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 min-h-0 overflow-hidden">
              {/* Mobile: Full-screen tabs */}
              <div className="block lg:hidden h-full">
                <Tabs defaultValue="details" className="flex flex-col h-full">
                  <TabsList className="grid w-full grid-cols-3 mx-4 mt-4 mb-0">
                    <TabsTrigger value="details" className="text-sm">
                      Details
                    </TabsTrigger>
                    <TabsTrigger value="comments" className="text-sm">
                      Comments ({task.comments?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="properties" className="text-sm">
                      Properties
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="flex-1 mt-0 min-h-0">
                    <ScrollArea className="h-full">
                      <div className="p-4 space-y-6">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-3">Description</h3>
                          <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add a detailed description..."
                            className="min-h-[200px] resize-none text-sm leading-relaxed"
                          />
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="comments" className="flex-1 mt-0 min-h-0">
                    <div className="flex flex-col h-full">
                      <ScrollArea className="flex-1 min-h-0">
                        <div className="p-4 space-y-3">
                          {task.comments?.length > 0 ? (
                            task.comments.map((comment) => (
                              /* Made comment cards more compact */
                              <div
                                key={comment.id}
                                className="border-l-2 border-l-primary/30 pl-3 py-2 bg-muted/20 rounded-r-lg"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                      <User className="w-3 h-3 text-primary" />
                                    </div>
                                    <span className="font-medium text-xs">{comment.author_name}</span>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {(() => {
                                      try {
                                        return format(new Date(comment.created_at), "MMM d")
                                      } catch {
                                        return "Invalid date"
                                      }
                                    })()}
                                  </span>
                                </div>
                                <p className="text-xs text-foreground/80 break-words leading-relaxed pl-8">
                                  {comment.content}
                                </p>
                              </div>
                            ))
                          ) : (
                            <div className="flex items-center justify-center h-48">
                              <div className="text-center">
                                <MessageSquare className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                                <p className="text-sm text-muted-foreground">No comments yet</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </ScrollArea>

                      <div className="p-4 border-t bg-muted/20 flex-shrink-0">
                        <form onSubmit={handleSubmitComment} className="flex gap-2">
                          <Input
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            className="flex-1 text-sm"
                          />
                          <Button type="submit" size="icon" disabled={!newComment.trim()} className="h-10 w-10">
                            <Send className="w-4 h-4" />
                          </Button>
                        </form>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="properties" className="flex-1 mt-0 min-h-0">
                    <ScrollArea className="h-full">
                      <div className="p-3 space-y-4">
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
                            <SelectTrigger className="text-sm">
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
                              <CalendarIcon className="w-4 h-4 mr-2" />
                              Start Date
                            </label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal text-sm",
                                    !startDate && "text-muted-foreground",
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                                  <span className="truncate">
                                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                                  </span>
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
                                    "w-full justify-start text-left font-normal text-sm",
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

                        {/* File Upload */}
                        <div>
                          <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload File
                          </label>
                          <div className="space-y-2">
                            <Input type="file" ref={fileInputRef} onChange={handleFileSelect} className="text-sm" />
                            {selectedFile && (
                              <Button onClick={handleFileUpload} disabled={isUploading} size="sm" className="w-full">
                                {isUploading ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload &quot;{selectedFile.name.substring(0, 20)}...&quot;
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Desktop: Modern full-width layout with floating sidebar */}
              <div className="hidden lg:flex h-full relative">
                <div
                  className={cn(
                    "flex flex-col min-h-0 transition-all duration-300",
                    sidebarOpen ? "w-[calc(100%-380px)]" : "w-full",
                  )}
                >
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <ScrollArea className="h-full">
                      <div className="p-8 max-w-4xl mx-auto space-y-8">
                        {/* Description Section */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-semibold">Description</h3>
                          </div>
                          <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add a detailed description of the task..."
                            className="min-h-[200px] resize-none text-sm leading-relaxed border-2 focus:border-primary/50"
                          />
                        </div>

                        <Separator className="my-8" />

                        {/* Comments Section */}
                        <div className="space-y-6">
                          <div className="flex items-center gap-3">
                            <MessageSquare className="w-6 h-6 text-primary" />
                            <h3 className="text-lg font-semibold">Comments & Activity</h3>
                            <Badge variant="secondary" className="text-sm px-3 py-1">
                              {task.comments?.length || 0}
                            </Badge>
                          </div>

                          <div className="space-y-4">
                            {task.comments?.length > 0 ? (
                              /* Fixed comments scrolling with proper height constraint */
                              <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
                                {task.comments.map((comment) => (
                                  /* Made desktop comment cards more compact */
                                  <div
                                    key={comment.id}
                                    className="border-l-3 border-l-primary/30 pl-4 py-3 bg-muted/10 rounded-r-lg hover:bg-muted/20 transition-colors"
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                          <User className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                          <span className="font-medium text-sm">{comment.author_name}</span>
                                          <p className="text-xs text-muted-foreground">
                                            {(() => {
                                              try {
                                                return format(new Date(comment.created_at), "MMM d, h:mm a")
                                              } catch {
                                                return "Invalid date"
                                              }
                                            })()}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                    <p className="text-sm text-foreground/90 break-words leading-relaxed pl-9">
                                      {comment.content}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex items-center justify-center h-48 border-2 border-dashed border-muted-foreground/20 rounded-xl">
                                <div className="text-center">
                                  <MessageSquare className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                                  <p className="text-lg font-medium text-muted-foreground mb-2">No comments yet</p>
                                  <p className="text-sm text-muted-foreground/70">
                                    Start the conversation and share your thoughts
                                  </p>
                                </div>
                              </div>
                            )}

                            <div className="border-2 border-dashed border-primary/30 hover:border-primary/50 transition-colors bg-gradient-to-r from-primary/5 to-transparent rounded-lg p-4">
                              <form onSubmit={handleSubmitComment} className="flex gap-3">
                                <Input
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  placeholder="Share your thoughts..."
                                  className="flex-1 border-0 bg-background/50 focus-visible:ring-2 focus-visible:ring-primary/30 text-sm h-10"
                                />
                                <Button
                                  type="submit"
                                  size="icon"
                                  disabled={!newComment.trim()}
                                  className="h-10 w-10 bg-primary hover:bg-primary/90"
                                >
                                  <Send className="w-4 h-4" />
                                </Button>
                              </form>
                            </div>
                          </div>
                        </div>
                        <div className="h-8" />
                      </div>
                    </ScrollArea>
                  </div>
                </div>

                {sidebarOpen && (
                  /* Fixed sidebar scrolling with proper height */
                  <div className="w-[380px] bg-gradient-to-b from-muted/30 via-muted/20 to-muted/10 border-l shadow-xl flex flex-col">
                    <div className="flex-1 min-h-0 overflow-hidden">
                      <ScrollArea className="h-full">
                        <div className="p-6 space-y-6">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Properties</h3>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSidebarOpen(false)}
                              className="h-8 w-8"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Priority */}
                          <div className="space-y-3">
                            <label className="text-sm font-medium text-muted-foreground flex items-center">
                              <Flag className="w-4 h-4 mr-2" />
                              Priority
                            </label>
                            <Select
                              value={priority || "Medium"}
                              onValueChange={(value: string) => setPriority(value as TaskDetails["priority"])}
                            >
                              <SelectTrigger className="w-full">
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
                            <div className="space-y-3">
                              <label className="text-sm font-medium text-muted-foreground flex items-center">
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
                                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <DayPicker mode="single" selected={startDate} onSelect={setStartDate} />
                                </PopoverContent>
                              </Popover>
                            </div>

                            <div className="space-y-3">
                              <label className="text-sm font-medium text-muted-foreground flex items-center">
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
                                    {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <DayPicker mode="single" selected={dueDate} onSelect={setDueDate} />
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>

                          {/* Labels */}
                          <div className="space-y-3">
                            <label className="text-sm font-medium text-muted-foreground flex items-center">
                              <Tag className="w-4 h-4 mr-2" />
                              Labels
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {task.labels && task.labels.length > 0 ? (
                                task.labels.map((label) => (
                                  <Badge key={label.id} variant="secondary" className="text-xs px-2 py-1">
                                    {label.name}
                                  </Badge>
                                ))
                              ) : (
                                <p className="text-sm text-muted-foreground italic">No labels assigned</p>
                              )}
                            </div>
                          </div>

                          {/* Attachments */}
                          <div className="space-y-3">
                            <label className="text-sm font-medium text-muted-foreground flex items-center">
                              <Paperclip className="w-4 h-4 mr-2" />
                              Attachments ({task.attachments?.length || 0})
                            </label>

                            <div className="space-y-3">
                              {task.attachments && task.attachments.length > 0 && (
                                /* Fixed attachments scrolling with proper height */
                                <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
                                  {task.attachments.map((attachment) => (
                                    <div
                                      key={attachment.id}
                                      className="p-3 border rounded-lg hover:shadow-sm transition-shadow bg-background/50"
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                          {getFileIcon(attachment.file_name)}
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate" title={attachment.file_name}>
                                              {attachment.file_name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              {(() => {
                                                try {
                                                  return format(new Date(attachment.uploaded_at), "MMM d")
                                                } catch {
                                                  return "Invalid date"
                                                }
                                              })()}
                                            </p>
                                          </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                          <Download className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="space-y-2">
                                <Input type="file" ref={fileInputRef} onChange={handleFileSelect} className="text-sm" />
                                {selectedFile && (
                                  <Button
                                    onClick={handleFileUpload}
                                    disabled={isUploading}
                                    size="sm"
                                    className="w-full"
                                  >
                                    {isUploading ? (
                                      <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Uploading...
                                      </>
                                    ) : (
                                      <>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Upload &quot;{selectedFile.name.substring(0, 15)}...&quot;
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                          <div>
        <h4 className="font-semibold text-sm mb-1 flex items-center">
            <Github className="w-4 h-4 mr-2"/>GitHub
        </h4>
        
        {/* Display existing links */}
        <div className="space-y-1 mb-2">
            {task.github_links?.map(link => (
                <a key={link.id} href={link.github_item_url} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline truncate block">
                    {link.github_item_url.replace('https://github.com/', '')}
                </a>
            ))}
        </div>

        {/* Form to add a new link */}
        <div className="flex gap-2">
            <Input 
                value={githubPrUrl}
                onChange={(e) => setGithubPrUrl(e.target.value)}
                placeholder="Paste PR URL..." 
                className="text-xs h-8" 
            />
            <Button onClick={handleLinkToGithub} size="sm" className="h-8">Link</Button>
        </div>
                
    </div>
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t bg-gradient-to-r from-muted/30 to-background px-4 sm:px-6 py-4 flex-shrink-0">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 bg-transparent"
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

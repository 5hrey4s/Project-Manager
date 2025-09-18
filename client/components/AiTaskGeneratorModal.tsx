"use client"

import type React from "react"
import { useState, type FormEvent } from "react"
import { Sparkles, Plus, Loader2 } from "lucide-react"
import { createTask, generateAiTasks } from "../services/api"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface Task {
  id: number
  title: string
  status: "To Do" | "In Progress" | "Done"
  assignee_id: number | null
  project_id: number
}

interface AiTaskGeneratorModalProps {
  projectId: string
  onClose: () => void
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
}

export default function AiTaskGeneratorModal({ projectId, onClose, setTasks }: AiTaskGeneratorModalProps) {
  const [aiGoal, setAiGoal] = useState("")
  const [suggestedTasks, setSuggestedTasks] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiError, setAiError] = useState("")
  
const handleGenerateTasks = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsGenerating(true);
    setSuggestedTasks([]);
    setAiError("");
    try {
      const res = await generateAiTasks(aiGoal, projectId);

      // --- THIS IS THE FIX ---
      // We must verify that the data from the API is actually an array
      // before we try to set it in our state.
      if (Array.isArray(res.data)) {
        setSuggestedTasks(res.data);
      } else {
        // If it's not an array, we throw an error to be caught below.
        console.error("API response was not in the expected array format:", res.data);
        throw new Error("Received an invalid format from the AI service.");
      }

    } catch (error) {
      console.error("AI Generation Error:", error);
      setAiError("Failed to generate tasks. The AI might be unavailable or the response was invalid.");
    } finally {
      setIsGenerating(false);
    }
  };
  // --- THIS IS THE FIX ---
  const handleAddTask = async (taskTitle: string) => {
    try {
      // Call createTask with a single object, including a default status
      const res = await createTask({
        projectId: parseInt(projectId, 10),
        title: taskTitle,
        status: "To Do",
      });
      
      setTasks((prev) => [...prev, res.data]);
      toast.success(`Task "${taskTitle}" added.`);
      // Remove the added task from the suggestion list
      setSuggestedTasks((prev) => prev.filter((t) => t !== taskTitle));
    } catch (error) {
      toast.error(`Failed to add task: ${taskTitle}`);
      console.error("Failed to add AI task", error);
    }
  }

  const handleClose = () => {
    setAiGoal("")
    setSuggestedTasks([])
    setAiError("")
    onClose()
  }

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>AI Task Generator</DialogTitle>
          <DialogDescription>
            Describe your main goal, and the AI will suggest a list of tasks to help you achieve it.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleGenerateTasks} className="space-y-4">
          <Textarea
            placeholder="e.g., Launch a new marketing campaign for our Q4 product release."
            value={aiGoal}
            onChange={(e) => setAiGoal(e.target.value)}
            rows={3}
            disabled={isGenerating}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isGenerating || !aiGoal.trim()}>
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Tasks
                </>
              )}
            </Button>
          </div>
        </form>

        {suggestedTasks.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">Suggested Tasks</h3>
              <Badge variant="secondary">{suggestedTasks.length}</Badge>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
              {suggestedTasks.map((task, index) => (
                <div key={index} className="flex items-center justify-between gap-3 p-3 bg-muted/50 rounded-md">
                  <p className="text-sm text-foreground flex-1">{task}</p>
                  <Button onClick={() => handleAddTask(task)} size="sm" variant="secondary" className="shrink-0">
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {aiError && (
            <p className="text-sm text-destructive">{aiError}</p>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
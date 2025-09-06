// AiTaskGeneratorModal.tsx
"use client"

import type React from "react"

import { useState, type FormEvent } from "react"
import { Sparkles, Plus, Loader2 } from "lucide-react"
import { createTask, generateAiTasks } from "../services/api"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// --- CHANGE: Import Dialog components ---
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
    e.preventDefault()
    setIsGenerating(true)
    setSuggestedTasks([])
    setAiError("")
    try {
      const response = await generateAiTasks(projectId, aiGoal)
      setSuggestedTasks(response.data.suggestedTasks)
    } catch (error) {
      console.error(error)
      setAiError("Failed to generate tasks. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAddTask = async (taskTitle: string) => {
    try {
      const response = await createTask(projectId, taskTitle)
      setTasks((prevTasks) => [...prevTasks, response.data])
      setSuggestedTasks((prev) => prev.filter((t) => t !== taskTitle))
    } catch (error) {
      console.error("Failed to add task", error)
    }
  }

  const handleClose = () => {
    setSuggestedTasks([])
    setAiError("")
    onClose()
  }

  // --- CHANGE: Replaced outer div and Card with Dialog components ---
  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            AI Task Generator
          </DialogTitle>
          <DialogDescription>
            Describe a goal, and the AI will suggest a list of tasks to accomplish it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleGenerateTasks} className="space-y-4 pt-2">
          <Textarea
            value={aiGoal}
            onChange={(e) => setAiGoal(e.target.value)}
            placeholder="e.g., Build a user authentication system with login, registration, and password reset functionality..."
            className="min-h-[100px] resize-none"
            required
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isGenerating}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
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
"use client"

import type React from "react"

import { useState, type FormEvent } from "react"
import { X, Sparkles, Plus, Loader2 } from "lucide-react"
import { createTask, generateAiTasks } from "../services/api"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge" // Ensure Badge is imported from the correct UI component path

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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              AI Task Generator
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleClose} className="text-white hover:bg-white/20">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <form onSubmit={handleGenerateTasks} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Describe your project goal or feature</label>
              <Textarea
                value={aiGoal}
                onChange={(e) => setAiGoal(e.target.value)}
                placeholder="e.g., Build a user authentication system with login, registration, and password reset functionality..."
                className="min-h-[100px] resize-none"
                required
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
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
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">Suggested Tasks</h3>
                <Badge variant="secondary">{suggestedTasks.length}</Badge>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2">
                {suggestedTasks.map((task, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm text-foreground flex-1 leading-relaxed">{task}</p>
                        <Button onClick={() => handleAddTask(task)} size="sm" className="shrink-0">
                          <Plus className="w-3 h-3 mr-1" />
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {aiError && (
            <Card className="border-destructive bg-destructive/5">
              <CardContent className="p-4">
                <p className="text-sm text-destructive">{aiError}</p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

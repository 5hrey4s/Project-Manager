"use client"

import React, { useState, FormEvent } from "react";
import { Sparkles, Plus, Loader2 } from "lucide-react";
import { createTask, generateAiTasks } from "../services/api";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Define the structure for the richer task suggestions
interface SuggestedTask {
  title: string;
  description: string;
  suggested_assignee_id: number | null;
}

// Define the structure of a full Task object in your app state
interface Task {
  id: number;
  title: string;
  status: "To Do" | "In Progress" | "Done";
  assignee_id: number | null;
  project_id: number;
}

interface AiTaskGeneratorModalProps {
  projectId: string;
  onClose: () => void;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export default function AiTaskGeneratorModal({ projectId, onClose, setTasks }: AiTaskGeneratorModalProps) {
  const [aiGoal, setAiGoal] = useState("");
  const [suggestedTasks, setSuggestedTasks] = useState<SuggestedTask[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState("");

  const handleGenerateTasks = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsGenerating(true);
    setSuggestedTasks([]);
    setAiError("");
    try {
      const res = await generateAiTasks(aiGoal, projectId);
      if (Array.isArray(res.data)) {
        setSuggestedTasks(res.data);
      } else {
        throw new Error("Received an invalid format from the AI.");
      }
    } catch (error) {
      console.error("AI Generation Error:", error);
      setAiError("Failed to generate tasks. The AI might be unavailable or the response was invalid.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddTask = async (taskSuggestion: SuggestedTask) => {
    try {
      const res = await createTask({
        projectId: parseInt(projectId, 10),
        title: taskSuggestion.title,
        description: taskSuggestion.description,
        status: "To Do",
        assignee_id: taskSuggestion.suggested_assignee_id,
      });
      
      setTasks((prev) => [...prev, res.data]);
      setSuggestedTasks((prev) => prev.filter((t) => t.title !== taskSuggestion.title));
      toast.success(`Task "${taskSuggestion.title}" added.`);

    } catch (error) {
      toast.error("Failed to add task.");
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>AI Task Generator</DialogTitle>
          <DialogDescription>
            Describe a high-level goal, and the AI will break it down into tasks based on your project's current state.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleGenerateTasks} className="space-y-4 pt-2">
          <Textarea
            value={aiGoal}
            onChange={(e) => setAiGoal(e.target.value)}
            placeholder="e.g., 'Implement a full user authentication system'"
            rows={3}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isGenerating || !aiGoal.trim()}>
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />Generate Tasks</>
              )}
            </Button>
          </div>
        </form>

        {suggestedTasks.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="font-semibold text-foreground">Suggested Tasks</h3>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
              {suggestedTasks.map((task, index) => (
                <div key={index} className="flex items-start justify-between gap-3 p-3 bg-muted/50 rounded-md">
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-foreground">{task.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                  </div>
                  <Button onClick={() => handleAddTask(task)} size="sm" variant="secondary" className="shrink-0">
                    <Plus className="w-3 h-3 mr-1" />Add
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {aiError && (<p className="text-sm text-destructive">{aiError}</p>)}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
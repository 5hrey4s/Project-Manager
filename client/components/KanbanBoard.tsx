"use client"

import type React from "react"
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors, closestCorners } from "@dnd-kit/core"
import { updateTaskStatus, assignTask } from "../services/api"
import Column from "./Column"

// --- Define Consistent and Complete Types ---
export type TaskStatus = "To Do" | "In Progress" | "Done"

export interface Task {
  id: number
  title: string
  status: TaskStatus
  assignee_id: number | null
  project_id: number
}

export interface Member {
  id: number
  username: string
}

interface KanbanBoardProps {
  tasks: Task[]
  members: Member[]
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  onTaskClick: (taskId: number) => void 
    onAddTask: (status: TaskStatus) => void; 

}

export default function KanbanBoard({ tasks, members, setTasks, onTaskClick ,onAddTask }: KanbanBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require the mouse to move 10 pixels before activating a drag
      activationConstraint: {
        distance: 10,
      },
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    // If the item is dropped over a different column
    if (over && active.id !== over.id) {
      const activeTask = tasks.find((t) => t.id === active.id)
      const destinationColumn = over.id as TaskStatus

      if (activeTask && activeTask.status !== destinationColumn) {
        handleStatusChange(activeTask.id as number, destinationColumn)
      }
    }
  }

  const handleStatusChange = async (taskId: number, newStatus: TaskStatus) => {
    // Optimistically update the UI for a smooth experience
    setTasks((prevTasks) => prevTasks.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task)))

    try {
      // Send the update to the backend
      await updateTaskStatus(taskId, newStatus)
    } catch (error) {
      console.error("Failed to update task status:", error)
      // Here you could add logic to revert the UI change on failure
    }
  }

  const handleAssignTask = async (taskId: number, assigneeId: number | null) => {
    // Optimistically update the UI
    setTasks((prevTasks) => prevTasks.map((task) => (task.id === taskId ? { ...task, assignee_id: assigneeId } : task)))

    try {
      // Send the update to the backend
      await assignTask(taskId, assigneeId)
    } catch (error) {
      console.error("Failed to assign task:", error)
    }
  }

  const columnDefinitions: { id: TaskStatus; title: string }[] = [
    { id: "To Do", title: "To Do" },
    { id: "In Progress", title: "In Progress" },
    { id: "Done", title: "Done" },
  ]

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {columnDefinitions.map(({ id, title }) => (
          <Column
            key={id}
            id={id}
            title={title}
            tasks={tasks.filter((task) => task.status === id)}
            members={members}
            onAssign={handleAssignTask}
            onTaskClick={onTaskClick} 
                        onAddTask={onAddTask} // <<< PASS THE PROP DOWN

          />
        ))}
      </div>
    </DndContext>
  )
}
"use client"

import { SortableContext } from "@dnd-kit/sortable"
import { useDroppable } from "@dnd-kit/core"
import TaskCard from "./TaskCard"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

// Define the types needed for this component
type TaskStatus = "To Do" | "In Progress" | "Done"

interface Task {
  id: number
  title: string
  status: TaskStatus
  assignee_id: number | null
}

interface Member {
  id: number
  username: string
}

interface ColumnProps {
  id: TaskStatus
  title: string
  tasks: Task[]
  members: Member[]
  onAssign: (taskId: number, assigneeId: number | null) => void
  onTaskClick: (taskId: number) => void 
    onAddTask: (status: TaskStatus) => void; 

}

const getColumnStyles = (id: TaskStatus) => {
  switch (id) {
    case "To Do":
      return "border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
    case "In Progress":
      return "border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20"
    case "Done":
      return "border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
    default:
      return "border-l-gray-500 bg-gray-50/50 dark:bg-gray-950/20"
  }
}

const getColumnBadgeStyles = (id: TaskStatus) => {
  switch (id) {
    case "To Do":
      return "bg-blue-100 text-blue-800"
    case "In Progress":
      return "bg-amber-100 text-amber-800"
    case "Done":
      return "bg-emerald-100 text-emerald-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export default function Column({ id, title, tasks, members, onAssign, onTaskClick,onAddTask  }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <Card
      ref={setNodeRef}
      className={`
        ${getColumnStyles(id)}
        border-l-4 p-6 min-h-[600px] transition-all duration-200
        ${isOver ? "ring-2 ring-primary/20 shadow-lg scale-[1.02]" : "shadow-sm"}
      `}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-semibold text-lg text-foreground">{title}</h2>
        <Badge variant="secondary" className={`${getColumnBadgeStyles(id)} font-medium`}>
          {tasks.length}
        </Badge>
      </div>

    <div className="flex flex-col flex-grow">
        <SortableContext id={id} items={tasks.map((t) => t.id)}>
          <div className="space-y-3 flex-grow">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                members={members}
                onAssign={onAssign}
                onCardClick={onTaskClick}
              />
            ))}
            {/* ... (empty state div remains the same) */}
          </div>
        </SortableContext>
        
        {/* --- ADD THIS BUTTON AT THE BOTTOM --- */}
        <div className="mt-4">
          <Button variant="ghost" className="w-full" onClick={() => onAddTask(id)}>
            <Plus className="w-4 h-4 mr-2" />
            Add a card
          </Button>
        </div>
      </div>
    </Card>
  )
}
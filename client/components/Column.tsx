"use client"

import { SortableContext } from "@dnd-kit/sortable"
import { useDroppable } from "@dnd-kit/core"
import TaskCard from "./TaskCard"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

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
  onTaskClick: (taskId: number) => void // <<< ADD THIS PROP
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

export default function Column({ id, title, tasks, members, onAssign, onTaskClick }: ColumnProps) {
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

      <SortableContext id={id} items={tasks.map((t) => t.id)}>
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              members={members}
              onAssign={onAssign}
              onCardClick={onTaskClick} // <<< PASS THE PROP DOWN
            />
          ))}
          {tasks.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <p className="text-sm">No tasks here.</p>
            </div>
          )}
        </div>
      </SortableContext>
    </Card>
  )
}
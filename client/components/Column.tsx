"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Plus } from "lucide-react"
import { Task, Member, TaskStatus } from "./KanbanBoard" // Import types from parent
import TaskCard from "./TaskCard"
import { Button } from "@/components/ui/button"

interface ColumnProps {
  id: TaskStatus
  title: string
  tasks: Task[]
  members: Member[]
  onAssign: (taskId: number, assigneeId: number | null) => void
  onTaskClick: (taskId: number) => void
  onAddTask: (status: TaskStatus) => void
}

export default function Column({ id, title, tasks, members, onAssign, onTaskClick, onAddTask }: ColumnProps) {
  const { setNodeRef } = useDroppable({ id })

  return (
    <div ref={setNodeRef} className="bg-gray-100 dark:bg-gray-800/50 p-4 rounded-lg">
      <h2 className="font-semibold mb-4 text-gray-700 dark:text-gray-300">{title}</h2>
      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              members={members}
              onAssign={onAssign}
              // --- FIX: Rename prop to match TaskCard's expectation ---
              onCardClick={onTaskClick}
            />
          ))}
        </div>
      </SortableContext>
      <Button
        onClick={() => onAddTask(id)}
        variant="ghost"
        className="w-full mt-4 text-gray-600 dark:text-gray-400"
      >
        <Plus size={16} className="mr-2" /> Add Task
      </Button>
    </div>
  )
}
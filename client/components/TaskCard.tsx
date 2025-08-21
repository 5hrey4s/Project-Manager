"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"

// Define the types needed for this component
interface Member {
  id: number
  username: string
}

interface Task {
  id: number
  title: string
  assignee_id: number | null
}

interface TaskCardProps {
  task: Task
  members: Member[]
  onAssign: (taskId: number, assigneeId: number | null) => void
}

export default function TaskCard({ task, members, onAssign }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: {
      type: "task",
      task,
    },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
  }

  const assignee = members.find((m) => m.id === task.assignee_id)

  const handleAssignmentChange = (value: string) => {
    const newAssigneeId = value === "unassigned" ? null : Number.parseInt(value, 10)
    onAssign(task.id, newAssigneeId)
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        group cursor-grab active:cursor-grabbing transition-all duration-200
        hover:shadow-md hover:-translate-y-1 border-l-4 border-l-transparent
        hover:border-l-primary/50 touch-none
        ${isDragging ? "opacity-50 shadow-2xl rotate-3 scale-105 z-50" : ""}
      `}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <p className="font-medium text-sm leading-relaxed text-foreground group-hover:text-primary transition-colors">
            {task.title}
          </p>

          <div className="flex items-center justify-between">
            <Select value={task.assignee_id?.toString() ?? "unassigned"} onValueChange={handleAssignmentChange}>
              <SelectTrigger
                className="w-auto h-8 text-xs border-0 bg-muted/50 hover:bg-muted focus:ring-1"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">
                  <span className="text-muted-foreground">Unassigned</span>
                </SelectItem>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id.toString()}>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-4 h-4">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {member.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{member.username}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {assignee && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs px-2 py-0.5">
                  {assignee.username}
                </Badge>
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                    {assignee.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

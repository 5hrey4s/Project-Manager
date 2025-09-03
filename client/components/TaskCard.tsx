"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"

// --- Type Definitions ---
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
  onCardClick: (taskId: number) => void
}

export default function TaskCard({ task, members, onAssign, onCardClick }: TaskCardProps) {
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

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent the select dropdown from triggering the card click
    if ((e.target as HTMLElement).closest('.radix-select-trigger')) {
      e.stopPropagation();
      return;
    }
    onCardClick(task.id)
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleCardClick}
      className={`p-4 bg-background shadow-sm rounded-lg border hover:shadow-md cursor-pointer transition-shadow ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
    >
      <CardContent className="p-0">
        <div className="flex flex-col gap-3">
          <p className="font-medium text-sm text-foreground leading-snug">{task.title}</p>
          <div className="flex items-center justify-between">
            <Select onValueChange={handleAssignmentChange} defaultValue={assignee?.id.toString() || 'unassigned'}>
              <SelectTrigger className="radix-select-trigger w-auto h-auto text-xs bg-transparent border-none focus:ring-0 p-0">
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
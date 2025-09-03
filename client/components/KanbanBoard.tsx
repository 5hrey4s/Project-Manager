"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, closestCorners } from "@dnd-kit/core"
import { io, Socket } from "socket.io-client"
import Column from "./Column"

// --- Type Definitions ---
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
  projectId: string
  members: Member[]
  onTaskClick: (taskId: number) => void
}

export default function KanbanBoard({ projectId, members, onTaskClick }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 10 } }))

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/tasks`, {
          headers: { "x-auth-token": token },
        })
        setTasks(res.data)
      } catch (error) {
        console.error("Failed to fetch tasks:", error)
      }
    }

    if (projectId) {
      fetchTasks()
    }

    const socket: Socket = io(process.env.NEXT_PUBLIC_API_URL!)
    socket.emit("join_project", projectId)

    socket.on("task_created", (newTask: Task) => {
      setTasks((prevTasks) => {
        if (!prevTasks.some(task => task.id === newTask.id)) {
          return [...prevTasks, newTask]
        }
        return prevTasks
      })
    })

    return () => {
      socket.disconnect()
    }
  }, [projectId])

  const handleAddTask = async (status: TaskStatus) => {
    const title = prompt("Enter a title for the new task:")
    if (!title || !title.trim()) return

    try {
      const token = localStorage.getItem("token")
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/tasks`,
        { title, projectId, status },
        { headers: { "x-auth-token": token } }
      )
      const newTask = res.data
      setTasks((prevTasks) => [...prevTasks, newTask])
    } catch (error) {
      console.error("Failed to add task:", error)
    }
  }
  
  const handleAssignTask = async (taskId: number, assigneeId: number | null) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, assignee_id: assigneeId } : t)));
    try {
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${taskId}/assign`, { assigneeId }, {
        headers: { "x-auth-token": localStorage.getItem("token") }
      });
    } catch (error) {
      console.error("Failed to assign task:", error);
    }
  };


  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const activeTask = tasks.find((t) => t.id === active.id)
      const destinationColumn = over.id as TaskStatus
      if (activeTask && activeTask.status !== destinationColumn) {
        setTasks((prev) => prev.map((t) => (t.id === active.id ? { ...t, status: destinationColumn } : t)))
        axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${active.id}/status`, { status: destinationColumn }, {
          headers: { "x-auth-token": localStorage.getItem("token") }
        }).catch(err => console.error("Failed to update status", err))
      }
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
            onAddTask={handleAddTask}
          />
        ))}
      </div>
    </DndContext>
  )
}
'use client';

import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, closestCorners } from "@dnd-kit/core";
import Column from "./Column";
import { updateTaskStatus, assignTask } from '../services/api';
import { toast } from 'sonner';

// --- Type Definitions ---
export type TaskStatus = "To Do" | "In Progress" | "Done";
export interface Task {
  id: number;
  title: string;
  status: TaskStatus;
  assignee_id: number | null;
  project_id: number;
}
export interface Member { id: number; username: string; }

// --- UPDATED PROPS ---
interface KanbanBoardProps {
  projectId: string;
  members: Member[];
  tasks: Task[]; // It now accepts tasks
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>; // And a function to update them
  onTaskClick: (taskId: number) => void;
  onAddTask: (status: TaskStatus) => void;
}

export default function KanbanBoard({ members, tasks, setTasks, onTaskClick, onAddTask }: KanbanBoardProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 10 } }));

  const handleAssignTask = async (taskId: number, assigneeId: number | null) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, assignee_id: assigneeId } : t)));
    try {
      await assignTask(taskId, assigneeId);
    } catch (error) {
      toast.error(`Failed to assign task.${error}`);
      // Revert on failure if necessary
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const activeTask = tasks.find((t) => t.id === active.id);
      const destinationColumn = over.id as TaskStatus;

      if (activeTask && activeTask.status !== destinationColumn) {
        setTasks((prev) => prev.map((t) => (t.id === active.id ? { ...t, status: destinationColumn } : t)));
        try {
          await updateTaskStatus(active.id as number, destinationColumn);
        } catch (err) {
          toast.error(`Failed to update task status.${err}`);
          setTasks((prev) => prev.map((t) => (t.id === active.id ? { ...t, status: activeTask.status } : t)));
        }
      }
    }
  };

  const columnDefinitions: { id: TaskStatus; title: string }[] = [{ id: "To Do", title: "To Do" }, { id: "In Progress", title: "In Progress" }, { id: "Done", title: "Done" }];

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
            onAddTask={onAddTask}
          />
        ))}
      </div>
    </DndContext>
  );
}
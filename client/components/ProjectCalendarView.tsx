'use client';

import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg } from '@fullcalendar/core';
import { getProjectTasks } from '../services/api';
import { toast } from 'sonner';

// Type for a task coming from our API
interface Task {
  id: number;
  title: string;
  start_date: string | null;
  due_date: string | null;
  status: string;
}

// Type for the event object FullCalendar expects
interface CalendarEvent {
  id: string;
  title: string;
  start?: string;
  end?: string;
  backgroundColor: string;
  borderColor: string;
}

// Props for our component
interface ProjectCalendarViewProps {
  projectId: number;
  onTaskClick: (taskId: number) => void;
}

export default function ProjectCalendarView({ projectId, onTaskClick }: ProjectCalendarViewProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    const fetchAndFormatTasks = async () => {
      try {
        const res = await getProjectTasks(projectId);
        const tasks: Task[] = res.data;

        const formattedEvents: CalendarEvent[] = tasks
          .filter(task => task.start_date || task.due_date) // Only show tasks that have a date
          .map(task => ({
            id: task.id.toString(),
            title: task.title,
            start: task.start_date || undefined,
            end: task.due_date || undefined,
            backgroundColor: task.status === 'Done' ? '#16a34a' : '#2563eb', // Green for done, blue for others
            borderColor: task.status === 'Done' ? '#16a34a' : '#2563eb',
          }));
        
        setEvents(formattedEvents);
      } catch (error) {
        toast.error("Failed to load tasks for the calendar.");
        console.error(error);
      }
    };

    if (projectId) {
      fetchAndFormatTasks();
    }
  }, [projectId]);

  const handleEventClick = (clickInfo: EventClickArg) => {
    // When a task on the calendar is clicked, open the details modal
    onTaskClick(Number(clickInfo.event.id));
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek'
        }}
        events={events}
        eventClick={handleEventClick}
        height="75vh" // Adjust height as needed
      />
    </div>
  );
}
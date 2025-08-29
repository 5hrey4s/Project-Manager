'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { Bell } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

// --- Type Definitions ---
interface Notification {
    id: number;
    content: string;
    is_read: boolean;
    created_at: string;
    sender_username: string;
    sender_avatar: string | null;
    project_id: number;
    task_id: number;
}

export default function NotificationBell() {
    const { user, isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    useEffect(() => {
        if (!isAuthenticated || !user) return;

        // --- Fetch initial notifications ---
        const fetchNotifications = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications`, {
                    headers: { 'x-auth-token': token },
                });
                setNotifications(res.data);
            } catch (error) {
                console.error("Failed to fetch notifications", error);
            }
        };
        fetchNotifications();
        
        // --- Set up WebSocket for real-time updates ---
        const socket: Socket = io(process.env.NEXT_PUBLIC_API_URL!, {
            query: { userId: user.id }, // Pass user ID for server to join the correct room
        });

        socket.on('new_notification', (newNotification: Notification) => {
            // Add the new notification to the top of the list and show a browser notification
            setNotifications(prev => [newNotification, ...prev]);
            
            if (Notification.permission === 'granted') {
                new Notification('KanbanFlow', {
                    body: newNotification.content,
                    icon: '/favicon.ico', // Optional: Add an icon
                });
            }
        });

        return () => {
            socket.disconnect();
        };

    }, [isAuthenticated, user]);
    
    // --- Request browser notification permission ---
    useEffect(() => {
        if (typeof window !== "undefined" && "Notification" in window) {
            if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
                Notification.requestPermission();
            }
        }
    }, []);

    const handleOpenChange = async (open: boolean) => {
        setIsOpen(open);
        if (!open && unreadCount > 0) {
            // When the popover is closed, mark all as read
            try {
                const token = localStorage.getItem('token');
                await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/read`, {}, {
                     headers: { 'x-auth-token': token } 
                });
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            } catch (error) {
                console.error("Failed to mark notifications as read", error);
            }
        }
    };
    
    // Helper to format the time since a notification was created
    const timeSince = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "m";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "min";
        return Math.floor(seconds) + "s";
    };

    return (
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 items-center justify-center text-xs text-white">
                                {unreadCount}
                            </span>
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
                <div className="p-4 border-b">
                    <h4 className="font-medium leading-none">Notifications</h4>
                </div>
                <ScrollArea className="h-96">
                    {notifications.length > 0 ? (
                        notifications.map((notif) => (
                            <Link 
                                href={`/project/${notif.project_id}?taskId=${notif.task_id}`} 
                                key={notif.id}
                                className="block"
                                onClick={() => setIsOpen(false)}
                            >
                                <div className={`p-4 border-b hover:bg-muted ${!notif.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                                    <p className="text-sm">
                                        <strong>{notif.sender_username || 'System'}</strong> {notif.content}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {timeSince(notif.created_at)} ago
                                    </p>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            You have no new notifications.
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
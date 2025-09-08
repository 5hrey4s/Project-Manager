// client/components/NotificationBell.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { Bell } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import InvitationCard from './InvitationCard';

// Interface for regular notifications
interface Notification {
  id: number;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_username: string;
  project_id: number;
  task_id: number;
}

// Interface for project invitations
interface Invitation {
    id: number;
    project_name: string;
    inviter_name: string;
}

export default function NotificationBell() {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const unreadCount = notifications.filter(n => !n.is_read).length + invitations.length;

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const token = localStorage.getItem('token');
      
      const fetchNotifications = async () => {
        try {
          const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications`, {
            headers: { 'x-auth-token': token },
          });
          setNotifications(res.data);
        } catch (error) {
          console.error("Failed to fetch notifications", error);
        }
      };

      const fetchInvitations = async () => {
          try {
              const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/invitations`, {
                  headers: { 'x-auth-token': token },
              });
              setInvitations(res.data);
          } catch (error) {
              console.error("Failed to fetch invitations", error);
          }
      };
      
      fetchNotifications();
      fetchInvitations();

      if (!socketRef.current) {
        socketRef.current = io(process.env.NEXT_PUBLIC_API_URL!, { query: { userId: user.id } });
        
        socketRef.current.on('new_notification', (newNotification: Notification) => {
          setNotifications(prev => [newNotification, ...prev]);
        });

        // --- FIX: Add a dedicated listener for INVITATIONS ---
        socketRef.current.on('new_invitation', (newInvitation: Invitation) => {
          setInvitations(prev => [newInvitation, ...prev]);
        });
      }

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    }
  }, [isAuthenticated, user?.id]);

  const handleInvitationAction = (invitationId: number) => {
    setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
  };

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    if (!open && notifications.filter(n => !n.is_read).length > 0) {
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
  
  const timeSince = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 5) return "just now";
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
            {/* Render Invitations First */}
            {invitations.length > 0 && (
                <div className="border-b">
                    <h5 className="p-2 text-sm font-semibold bg-gray-50 dark:bg-gray-800">Project Invitations</h5>
                    {invitations.map((inv) => (
                        <InvitationCard 
                            key={`invite-${inv.id}`} 
                            invitation={inv} 
                            onAction={handleInvitationAction} 
                        />
                    ))}
                </div>
            )}

            {/* Existing Notifications */}
            {notifications.length > 0 ? (
                notifications.map((notif) => (
                    <Link
                        href={notif.task_id ? `/project/${notif.project_id}?taskId=${notif.task_id}` : `/project/${notif.project_id}`}
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
                invitations.length === 0 && (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                        You have no new notifications.
                    </div>
                )
            )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
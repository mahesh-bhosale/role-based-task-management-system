import React, { createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { Notification } from '../types/api.types';
import { notificationsApi } from '../api/notifications.api';
import { useAuth } from './AuthContext';
import { useToast } from '../hooks/use-toast';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getNotifications({ limit: 10 }),
    enabled: isAuthenticated,
    // Removed refetchInterval, relying on WebSockets now
  });

  React.useEffect(() => {
    let socket: Socket | null = null;
    if (isAuthenticated) {
      const token = localStorage.getItem('token');
      if (token) {
        socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
          auth: { token },
          transports: ['websocket'],
        });

        socket.on('new_notification', (newNotification: Notification) => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          toast({ 
            title: 'New Notification', 
            description: newNotification.message 
          });
        });
      }
    }
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [isAuthenticated, queryClient, toast]);

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({ title: 'All notifications marked as read' });
    },
  });

  const notifications = notificationsData?.items || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const markAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAsRead, markAllAsRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

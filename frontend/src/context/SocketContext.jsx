import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import api from '../api';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [pendingQueries, setPendingQueries] = useState(0);
  const socketRef = useRef();

  // Fetch initial counts
  useEffect(() => {
    const fetchCounts = async () => {
      if (!user) return;

      try {
        if (user.role === 'super_admin') {
          const { data } = await api.get('/queries/all');
          if (Array.isArray(data)) {
            setPendingQueries(data.filter(q => q.status === 'Pending').length);
          }
        } else {
          // Business User
          const { data } = await api.get('/notifications');
          if (Array.isArray(data)) {
            setUnreadNotifications(data.filter(n => !n.isRead).length);
          }
          
          // Also fetch queries to see updates? Not needed for count badge usually.
        }
      } catch (error) {
        console.error("Failed to fetch initial socket counts", error);
      }
    };

    fetchCounts();
  }, [user]);

  useEffect(() => {
    if (user) {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const socketUrl = apiUrl.replace(/\/api\/?$/, ''); 
      
      // Prevent multiple connections
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      const newSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log("Socket Connected:", newSocket.id);
        if (user.role === 'super_admin') {
          newSocket.emit('join_room', 'super_admin');
        } else if (user.businessId) {
          const businessId = typeof user.businessId === 'object' ? user.businessId._id : user.businessId;
          newSocket.emit('join_room', businessId);
          newSocket.emit('join_room', 'all_businesses');
        }
      });

      newSocket.on('connect_error', (err) => {
        console.error("Socket Connection Error:", err.message);
      });

      // Events
      newSocket.on('newQuery', (data) => {
        if (user.role === 'super_admin') {
          setPendingQueries((prev) => prev + 1);
          toast.info(`New Query: ${data.subject}`, {
            description: `From ${data.businessId?.name || 'Business'}`,
            action: {
              label: 'View',
              onClick: () => window.location.href = '/admin/queries'
            }
          });
        }
      });

      newSocket.on('queryUpdated', (data) => {
        toast.success(`Query ${data.status}`, {
            description: data.subject,
        });
      });

      newSocket.on('newNotification', (data) => {
        setUnreadNotifications((prev) => prev + 1);
        toast.info(data.title, {
            description: data.message
        });
      });

      newSocket.on('newBroadcast', (data) => {
        setUnreadNotifications((prev) => prev + 1);
        toast.info(`Broadcast: ${data.title}`, {
            description: data.message
        });
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        unreadNotifications,
        pendingQueries,
        setUnreadNotifications,
        setPendingQueries,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

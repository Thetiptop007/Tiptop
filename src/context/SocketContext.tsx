import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { socketCoordinator } from '../services/socket.coordinator';
import { logger } from '../utils/logger';

interface SocketContextType {
  isConnected: boolean;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback?: (data: any) => void) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

interface SocketProviderProps {
  children: ReactNode;
  token: string | null;
  isAuthenticated: boolean;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children, token, isAuthenticated }) => {
  const [isConnected, setIsConnected] = React.useState(socketCoordinator.isConnected());

  useEffect(() => {
    if (isAuthenticated && token) {
      socketCoordinator.connect(token);
    } else {
      socketCoordinator.disconnect();
    }

    // Listen for connection status changes to trigger re-renders
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socketCoordinator.on('connect', handleConnect);
    socketCoordinator.on('disconnect', handleDisconnect);

    return () => {
      socketCoordinator.off('connect', handleConnect);
      socketCoordinator.off('disconnect', handleDisconnect);
    };
  }, [isAuthenticated, token]);

  const value: SocketContextType = {
    isConnected,
    joinRoom: (room: string) => socketCoordinator.joinRoom(room),
    leaveRoom: (room: string) => socketCoordinator.leaveRoom(room),
    on: (event: string, callback: (data: any) => void) => socketCoordinator.on(event, callback),
    off: (event: string, callback?: (data: any) => void) => socketCoordinator.off(event, callback),
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

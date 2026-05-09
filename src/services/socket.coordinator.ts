import { io, Socket } from 'socket.io-client';
import { logger } from '../utils/logger';

export enum SocketNamespace {
  DEFAULT = '/',
}

class SocketCoordinator {
  private socket: Socket | null = null;
  private isConnecting: boolean = false;

  /**
   * Connect to the socket server
   */
  public connect(token: string, namespace: SocketNamespace = SocketNamespace.DEFAULT): void {
    if (this.socket?.connected) {
      return;
    }

    if (this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    let serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    
    // If URL contains /api/v1, strip it for socket connection
    if (serverUrl.includes('/api/v1')) {
      serverUrl = serverUrl.replace('/api/v1', '');
    }

    this.socket = io(`${serverUrl}${namespace}`, {
      auth: { token },
      transports: ['websocket', 'polling'], // Allow polling as fallback
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      withCredentials: true, // Important for cookies/CORS
    });

    this.setupListeners();
  }

  /**
   * Disconnect from the socket server
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
  }

  /**
   * Join a specific room
   */
  public joinRoom(room: string): void {
    if (!this.socket) return;

    if (this.socket.connected) {
      this.socket.emit('track:order', room);
    } else {
      this.socket.once('connect', () => {
        this.socket?.emit('track:order', room);
      });
    }
  }

  /**
   * Leave a specific room
   */
  public leaveRoom(room: string): void {
    if (this.socket?.connected) {
      this.socket.emit('untrack:order', room);
    }
  }

  /**
   * Subscribe to an event
   */
  public on(event: string, callback: (data: any) => void): void {
    this.socket?.on(event, callback);
  }

  /**
   * Unsubscribe from an event
   */
  public off(event: string, callback?: (data: any) => void): void {
    this.socket?.off(event, callback);
  }

  /**
   * Setup global socket listeners for debugging and lifecycle
   */
  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnecting = false;
    });

    this.socket.on('connect_error', (error) => {
      this.isConnecting = false;
      logger.error('[SOCKET] Connection Error:', error.message);
    });

    this.socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') {
        this.socket?.connect();
      }
    });

    this.socket.on('reconnect_attempt', () => {
      // Intentionally empty
    });

    this.socket.on('reconnect', () => {
      // Intentionally empty
    });
  }

  /**
   * Check if socket is connected
   */
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketCoordinator = new SocketCoordinator();

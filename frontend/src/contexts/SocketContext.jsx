import { createContext, useContext, useEffect, useState } from 'react';
import { socket } from '../services/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { session } = useAuth();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (session) {
      socket.connect();
      
      socket.on('connect', () => setConnected(true));
      socket.on('disconnect', () => setConnected(false));

      return () => {
        socket.disconnect();
      };
    }
  }, [session]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);

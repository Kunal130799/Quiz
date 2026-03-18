import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import RoomPage from './pages/RoomPage'

function ProtectedRoute({ children }) {
  const { session } = useAuth()
  return session ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { session } = useAuth()
  return !session ? children : <Navigate to="/" replace />
}

import ErrorBoundary from './components/ErrorBoundary'
import { Toaster } from 'react-hot-toast'

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <SocketProvider>
            <Routes>
              <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
              <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
              <Route path="/room/:roomId" element={<ProtectedRoute><RoomPage /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster 
              position="bottom-right"
              toastOptions={{
                style: {
                  background: '#1a1a35',
                  color: '#f1f0ff',
                  border: '1px solid #2a2a55',
                },
              }}
            />
          </SocketProvider>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  )
}

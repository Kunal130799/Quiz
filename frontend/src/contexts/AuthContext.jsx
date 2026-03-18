import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for session
    const stored = localStorage.getItem('quiz_session');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        api.get(`/api/session/${parsed.id}`)
          .then(res => {
            setSession(res.data.session);
          })
          .catch(() => {
            localStorage.removeItem('quiz_session');
          })
          .finally(() => setLoading(false));
      } catch {
        localStorage.removeItem('quiz_session');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, avatar) => {
    const res = await api.post('/api/session', { username, avatar });
    setSession(res.data.session);
    localStorage.setItem('quiz_session', JSON.stringify(res.data.session));
    return res.data.session;
  };

  const logout = () => {
    setSession(null);
    localStorage.removeItem('quiz_session');
  };

  if (loading) {
    return (
      <div className="page-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ session, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

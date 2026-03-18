import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (username.length < 2) {
      return toast.error('Username must be at least 2 characters');
    }

    try {
      setLoading(true);
      await login(username);
      toast.success(`Welcome, ${username}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-center" style={{ backgroundImage: 'radial-gradient(circle at top, #1a1a35 0%, #0d0d1a 100%)', padding: '20px' }}>
      <div className="card animate-bounce-in" style={{ maxWidth: '440px', width: '100%', textAlign: 'center', padding: '40px 32px' }}>
        <div style={{ 
          fontSize: '3rem', 
          marginBottom: '20px', 
          display: 'inline-flex', 
          background: 'var(--accent-glow)', 
          width: '80px', 
          height: '80px', 
          borderRadius: '50%', 
          alignItems: 'center', 
          justifyContent: 'center',
          boxShadow: '0 0 30px var(--accent-glow)'
        }}>
          💀
        </div>
        <h1 className="glow-text" style={{ fontSize: '2.4rem', marginBottom: '8px' }}>AI Quiz Game</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Fast-paced trivia rounds. Test your knowledge.
        </p>

        <form onSubmit={handleSubmit} className="flex-column" style={{ gap: '16px' }}>
          <div className="input-group">
            <input
              type="text"
              className="input"
              placeholder="Enter your username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoFocus
              maxLength={15}
              style={{ textAlign: 'center', fontSize: '1.1rem', padding: '16px' }}
            />
          </div>
          
          <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading || !username.trim()} style={{ marginTop: '8px' }}>
            {loading ? <span className="spinner" style={{ width: '24px', height: '24px' }}></span> : 'Enter the Arena'}
          </button>
        </form>

        <p style={{ marginTop: '32px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          By entering, you agree to have fun and not take the AI's insults personally.
        </p>
      </div>
    </div>
  );
}

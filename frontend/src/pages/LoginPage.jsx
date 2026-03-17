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
    <div className="page-center" style={{ backgroundImage: 'radial-gradient(circle at top, #1a1a35 0%, #0d0d1a 100%)' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <h1 className="glow-text" style={{ fontSize: '2rem', marginBottom: '8px' }}>💀 AI Quiz Game</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Fast-paced trivia rounds. Test your knowledge.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="input-group">
            <input
              type="text"
              className="input"
              placeholder="Enter your username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoFocus
              maxLength={20}
            />
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={loading || !username.trim()}>
            {loading ? <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></span> : 'Enter the Void'}
          </button>
        </form>
      </div>
    </div>
  );
}

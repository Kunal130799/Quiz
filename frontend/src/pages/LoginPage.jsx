import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('https://api.dicebear.com/7.x/fun-emoji/svg?seed=Felix');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const AVATARS = [
    'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Felix',
    'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Garfield',
    'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Simba',
    'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Nala',
    'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Mittens',
    'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Boots'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (username.length < 2) {
      return toast.error('Username must be at least 2 characters');
    }

    try {
      setLoading(true);
      await login(username, avatar);
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
          Enter your handle and pick a face to join the arena.
        </p>

        <form onSubmit={handleSubmit} className="flex-column" style={{ gap: '24px' }}>
          <div className="input-group">
            <label className="input-label">Username</label>
            <input
              type="text"
              className="input"
              placeholder="Your handle..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoFocus
              maxLength={15}
              style={{ textAlign: 'center', fontSize: '1.1rem' }}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Pick your Vibe</label>
            <div className="flex-center" style={{ gap: '12px', flexWrap: 'wrap', padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)' }}>
              {AVATARS.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Avatar ${i}`}
                  className={`avatar avatar-md glow-border ${avatar === url ? 'selected' : ''}`}
                  style={{ 
                    cursor: 'pointer', 
                    padding: '4px',
                    background: avatar === url ? 'var(--accent)' : 'transparent',
                    border: avatar === url ? '2px solid var(--accent-light)' : '2px solid var(--border)',
                    transition: 'all 0.2s ease',
                    transform: avatar === url ? 'scale(1.1)' : 'scale(1)'
                  }}
                  onClick={() => setAvatar(url)}
                />
              ))}
            </div>
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

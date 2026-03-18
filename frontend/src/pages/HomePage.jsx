import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export default function HomePage() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  
  // Create Room Modal State
  const [showCreate, setShowCreate] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [topic, setTopic] = useState('Dad Jokes & Puns');
  const [rounds, setRounds] = useState(5);
  const [time, setTime] = useState(15);
  const [creating, setCreating] = useState(false);

  const TOPICS = [
    { name: 'Dad Jokes & Puns', icon: '🤡', desc: 'Pure groans and laughs' },
    { name: '90s Kid Nostalgia', icon: '🎮', desc: 'Cartoons and 90s vibes' },
    { name: 'Absurd Hypotheticals', icon: '🤔', desc: 'Weird "What if" questions' },
    { name: 'Internet Meme History', icon: '🐸', desc: 'Viral moments and memes' },
    { name: 'Comfort Food Trivia', icon: '🍕', desc: 'Delicious facts about food' },
    { name: 'Useless Superpowers', icon: '🦸', desc: 'Strange and funny abilities' }
  ];

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await api.get('/api/rooms');
      setRooms(res.data.rooms);
    } catch {
      // toast.error('Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) return toast.error('Room name required');

    try {
      setCreating(true);
      const res = await api.post('/api/rooms', {
        sessionId: session.id,
        name: roomName,
        topic: topic,
        maxPlayers: 10,
        totalRounds: parseInt(rounds),
        timePerQuestion: parseInt(time)
      });
      toast.success('Room created!');
      navigate(`/room/${res.data.room.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    try {
      // 1. Fetch room ID by code
      const res = await api.get(`/api/rooms/${joinCode}`);
      const roomId = res.data.room.id;
      
      // 2. Join the room
      await api.post(`/api/rooms/${roomId}/join`, { sessionId: session.id });
      navigate(`/room/${roomId}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid join code');
    }
  };

  const handleJoinClick = async (roomId) => {
    try {
      await api.post(`/api/rooms/${roomId}/join`, { sessionId: session.id });
      navigate(`/room/${roomId}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to join room');
    }
  };

  return (
    <div className="container" style={{ padding: '40px 0' }}>
      {/* Header */}
      <header className="flex-between" style={{ marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 className="glow-text" style={{ fontSize: '2rem' }}>AI Quiz Game</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome back, <span style={{ color: 'var(--accent-light)', fontWeight: 'bold' }}>{session.username}</span></p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <img src={session.avatar} alt="Avatar" className="avatar avatar-md glow-border" />
          <button onClick={logout} className="btn btn-ghost btn-icon" title="Logout">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
      </header>

      {/* Main Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        
        {/* Create Room Card */}
        <div className="card flex-column" style={{ alignItems: 'center', textAlign: 'center', gap: '16px', padding: '32px' }}>
          <div style={{ background: 'var(--accent-glow)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-light)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
          </div>
          <div>
            <h3>Create a Room</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '8px' }}>Host your own game. You control the pace.</p>
          </div>
          <button className="btn btn-primary btn-full" onClick={() => setShowCreate(true)} style={{ marginTop: 'auto' }}>
            Host Game
          </button>
        </div>

        {/* Join via Code Card */}
        <div className="card flex-column" style={{ alignItems: 'center', textAlign: 'center', gap: '16px', padding: '32px' }}>
          <div style={{ background: 'rgba(6,182,212,0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyan)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>
          </div>
          <div>
            <h3>Join via Code</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '8px' }}>Got a secret 6-character code? Drop it here.</p>
          </div>
          <form onSubmit={handleJoinByCode} style={{ width: '100%', marginTop: 'auto', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              className="input" 
              placeholder="e.g. AB3X9Z" 
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              style={{ textTransform: 'uppercase', textAlign: 'center', letterSpacing: '4px', fontWeight: 'bold', flex: 1, minWidth: '120px' }}
            />
            <button className="btn btn-secondary" disabled={joinCode.length < 6} style={{ flex: '0 0 auto' }}>Join</button>
          </form>
        </div>
      </div>

      {/* Public Rooms List */}
      <div>
        <h2 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          Public Lobbies
          <span className="badge badge-purple">{rooms.length} Active</span>
        </h2>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {[1,2,3].map(i => <div key={i} className="card skeleton" style={{ height: '160px' }}></div>)}
          </div>
        ) : rooms.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>👻</div>
            <p>No public lobbies available right now. Why not create one?</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {rooms.map(room => (
              <div key={room.id} className="card flex-column" style={{ gap: '16px' }}>
                <div className="flex-between" style={{ alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: '1.1rem', wordBreak: 'break-word' }}>{room.name}</h3>
                  <span className="badge badge-green">{room.code}</span>
                </div>
                
                <div className="flex-between" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    {room.playerCount} / {room.maxPlayers}
                  </span>
                  <span>{room.totalRounds} Rounds</span>
                </div>

                <button 
                  className="btn btn-secondary btn-full btn-sm"
                  onClick={() => handleJoinClick(room.id)}
                  disabled={room.playerCount >= room.maxPlayers}
                  style={{ marginTop: 'auto' }}
                >
                  {room.playerCount >= room.maxPlayers ? 'Room Full' : 'Join Game'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal flex-column" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 className="modal-title">Host New Game</h2>
            <form onSubmit={handleCreateRoom} className="modal-form">
              <div className="input-group">
                <label className="input-label">Room Name</label>
                <input 
                  type="text" 
                  className="input" 
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder={`${session.username}'s Game`}
                  autoFocus
                  maxLength={30}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Choose a Fun Category</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                  {TOPICS.map(t => (
                    <div 
                      key={t.name}
                      onClick={() => setTopic(t.name)}
                      className={`card ${topic === t.name ? 'selected' : ''}`}
                      style={{ 
                        padding: '12px', 
                        cursor: 'pointer', 
                        fontSize: '0.8rem', 
                        textAlign: 'center',
                        background: topic === t.name ? 'var(--accent-glow)' : 'var(--bg-secondary)',
                        border: topic === t.name ? '2px solid var(--accent)' : '1px solid var(--border)',
                        transition: 'all 0.2s ease',
                        boxShadow: topic === t.name ? '0 0 10px var(--accent-glow)' : 'none'
                      }}
                    >
                      <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{t.icon}</div>
                      <div style={{ fontWeight: 'bold' }}>{t.name}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
                <div className="input-group">
                  <label className="input-label">Rounds</label>
                  <select className="input" value={rounds} onChange={(e) => setRounds(e.target.value)}>
                    <option value="3">3 Quick Rounds</option>
                    <option value="5">5 Rounds (Std)</option>
                    <option value="10">10 Long Rounds</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Time Per Question</label>
                  <select className="input" value={time} onChange={(e) => setTime(e.target.value)}>
                    <option value="10">10s (Brutal)</option>
                    <option value="15">15s (Normal)</option>
                    <option value="30">30s (Relaxed)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={creating || !roomName.trim()}>
                  {creating ? 'Creating...' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

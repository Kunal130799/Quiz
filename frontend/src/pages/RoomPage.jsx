import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import VideoGrid from '../components/VideoGrid';
import { useWebRTC } from '../hooks/useWebRTC';
import SafetyNotice from '../components/SafetyNotice';

export default function RoomPage() {
  const { roomId } = useParams();
  const { session } = useAuth();
  const { socket, connected } = useSocket();
  const navigate = useNavigate();

  // Room State
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNotice, setShowNotice] = useState(true);
  
  // Game State
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answerResult, setAnswerResult] = useState(null); // { correct: boolean, points: number, correctAnswer }
  const [leaderboard, setLeaderboard] = useState([]);
  const [showReveal, setShowReveal] = useState(false);
  
  // Chat State
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);
  
  // WebRTC State
  const { localStream, remoteStreams, startLocalStream, stopLocalStream, initiateCall } = useWebRTC(socket, session, roomId, room?.players || []);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);

  // Timer Ref
  const timerRef = useRef(null);

  const isHost = room?.hostId === session?.id;

  // 1. Initial Fetch & Socket Setup
  useEffect(() => {
    if (!connected || !socket) return;
    
    // Join Room
    socket.emit('room:join', { sessionId: session.id, roomId });

    // Socket Event Listeners
    socket.on('room:state', ({ room: roomData }) => {
      setRoom(roomData);
      setLeaderboard(
        [...roomData.players].sort((a,b) => b.score - a.score)
          .map((p,i) => ({ ...p, rank: i+1 }))
      );
      setChatMessages(roomData.chatMessages);
      setLoading(false);
    });

    socket.on('room:players_update', ({ players }) => {
      setRoom(prev => prev ? { ...prev, players } : null);
    });

    socket.on('room:player_joined', ({ player }) => {
      toast.success(`${player.username} joined!`);
    });

    socket.on('room:player_kicked', ({ username }) => {
      toast.error(`${username} was kicked.`);
    });

    socket.on('room:kicked', ({ message }) => {
      toast.error(message);
      navigate('/');
    });

    // Game Events
    socket.on('game:starting', ({ message }) => {
      toast(message, { icon: '🎃' });
      setRoom(prev => prev ? { ...prev, status: 'playing', currentRound: 0 } : null);
    });

    socket.on('game:generating', ({ message }) => {
      toast.loading(message, { id: 'generating', duration: 3000 });
      setCurrentQuestion(null);
      setShowReveal(false);
      setSelectedAnswer(null);
      setAnswerResult(null);
    });

    socket.on('game:question', ({ round, total, question, options, timePerQuestion }) => {
      toast.dismiss('generating');
      setRoom(prev => prev ? { ...prev, currentRound: round } : null);
      setCurrentQuestion({ question, options, timePerQuestion });
      setTimeLeft(timePerQuestion);
      setShowReveal(false);
      setSelectedAnswer(null);
      setAnswerResult(null);
    });

    socket.on('game:answer_received', ({ points }) => {
      setAnswerResult(prev => ({ ...prev, pointsSubmitted: points }));
    });

    socket.on('game:reveal', ({ correct_answer, answers, leaderboard }) => {
      setShowReveal(true);
      setAnswerResult({
        correctAnswer: correct_answer,
        wasCorrect: selectedAnswer === correct_answer,
        points: answers[session.id]?.points || 0
      });
      setLeaderboard(leaderboard);
      setRoom(prev => {
        if (!prev) return prev;
        const newPlayers = prev.players.map(p => {
          const lEntry = leaderboard.find(l => l.id === p.id);
          return lEntry ? { ...p, score: lEntry.score } : p;
        });
        return { ...prev, players: newPlayers };
      });
      if (answers[session.id]?.isCorrect) {
         confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 }, colors: ['#7c3aed', '#ec4899', '#06b6d4'] });
      } else {
         toast('Oof. Wrong.', { icon: '💀' });
      }
    });

    socket.on('game:end', ({ leaderboard, message }) => {
      toast.success(message, { duration: 5000 });
      setRoom(prev => prev ? { ...prev, status: 'ended' } : null);
      setLeaderboard(leaderboard);
      setCurrentQuestion(null);
      setShowReveal(false);
      
      if (leaderboard[0]?.id === session.id) {
        confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 }, zIndex: 9999 });
      }
    });

    // Chat Events
    socket.on('chat:message', (msg) => {
      setChatMessages(prev => [...prev, msg].slice(-50));
    });

    return () => {
      if (socket) {
        socket.off('room:state');
        socket.off('room:players_update');
        socket.off('room:player_joined');
        socket.off('room:player_kicked');
        socket.off('room:kicked');
        socket.off('game:starting');
        socket.off('game:generating');
        socket.off('game:question');
        socket.off('game:answer_received');
        socket.off('game:reveal');
        socket.off('game:end');
        socket.off('chat:message');
      }
      clearInterval(timerRef.current);
    };
  }, [connected, socket, session.id, roomId, navigate, selectedAnswer]);

  // 2. Timer Countdown Logic
  useEffect(() => {
    if (currentQuestion && !showReveal && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [currentQuestion, showReveal, timeLeft]);

  // 3. Chat Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ─── Actions ───
  const copyJoinCode = () => {
    navigator.clipboard.writeText(room.code);
    toast.success('Join code copied!');
  };

  const handleStartGame = () => {
    socket.emit('game:start', { sessionId: session.id, roomId });
  };

  const handleStopGame = () => {
    if(window.confirm('Are you sure you want to end the game early?')) {
      socket.emit('game:stop', { sessionId: session.id, roomId });
    }
  };

  const handleKickPlayer = (targetId) => {
    socket.emit('room:kick', { sessionId: session.id, roomId, targetId });
  };

  const handleAnswerSubmit = (option) => {
    if (selectedAnswer || showReveal || timeLeft === 0) return;
    setSelectedAnswer(option);
    socket.emit('game:answer', { sessionId: session.id, roomId, answer: option });
  };

  const handleToggleVideo = async () => {
    if (isVideoEnabled) {
      stopLocalStream();
      setIsVideoEnabled(false);
    } else {
      const stream = await startLocalStream();
      if (stream) {
        setIsVideoEnabled(true);
        initiateCall(stream);
      } else {
        toast.error('Could not access camera/mic');
      }
    }
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socket.emit('chat:message', { sessionId: session.id, roomId, message: chatInput });
    setChatInput('');
  };

  const leaveRoom = () => {
    stopLocalStream();
    navigate('/');
  };

  if (loading || !room) {
    return <div className="page-center"><div className="spinner"></div></div>;
  }

  // ─── Render Helpers ───
  
  // Timer Color (Green -> Yellow -> Red)
  const timerRatio = currentQuestion ? timeLeft / currentQuestion.timePerQuestion : 0;
  const timerColor = timerRatio > 0.5 ? 'var(--green)' : timerRatio > 0.25 ? 'var(--yellow)' : 'var(--red)';

  return (
    <>
      {showNotice && <SafetyNotice onAccept={() => setShowNotice(false)} />}
      <div className="container" style={{ padding: '20px', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* ── HEADER ── */}
      <header className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem' }}>{room.name}</h1>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px', alignItems: 'center' }}>
            <div className="badge badge-purple" onClick={copyJoinCode} style={{ cursor: 'pointer', fontSize: '1rem', letterSpacing: '2px' }}>
              Code: {room.code} 📋
            </div>
            <div className="badge badge-cyan">
               {room.status === 'waiting' ? `Topic: ${room.topic}` : room.status === 'playing' ? `${room.topic} - Round ${room.currentRound}/${room.totalRounds}` : 'Game Ended'}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className={`btn btn-sm ${isVideoEnabled ? 'btn-danger' : 'btn-primary'}`} onClick={handleToggleVideo}>
            {isVideoEnabled ? '🔌 Leave Video' : '📷 Join Video'}
          </button>
          {isHost && room.status === 'waiting' && (
            <button className="btn btn-primary btn-sm animate-glow" onClick={handleStartGame}>
              ▶ Start Game
            </button>
          )}
          {isHost && room.status === 'playing' && (
            <button className="btn btn-danger btn-sm" onClick={handleStopGame}>
              🛑 End Game
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={leaveRoom}>Leave</button>
        </div>
      </header>

      {/* ── VIDEO AREA ── */}
      {(localStream || Object.keys(remoteStreams).length > 0) && (
        <VideoGrid 
          localStream={localStream} 
          remoteStreams={remoteStreams} 
          players={room.players} 
          session={session} 
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', flex: 1, alignItems: 'start' }}>
        
        {/* ── MAIN AREA (Game / Lobby) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {room.status === 'waiting' && (
            <div className="card" style={{ textAlign: 'center', padding: '60px 20px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
               <div style={{ fontSize: '4rem' }} className="animate-float">💀</div>
               <h2>Waiting for players...</h2>
               <p style={{ color: 'var(--text-secondary)' }}>Share the code <strong style={{color:'white'}}>{room.code}</strong> with your friends.</p>
               <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
                 {room.players.map(p => (
                   <div key={p.id} className="badge" style={{ padding: '8px 16px', fontSize: '0.9rem', background: 'var(--bg-secondary)', border: `1px solid ${p.id === room.hostId ? 'var(--accent)' : 'var(--border)'}` }}>
                      <img src={p.avatar} alt="avatar" style={{ width: '24px', height: '24px', borderRadius: '50%', marginRight: '8px', verticalAlign: 'middle' }} />
                      {p.username} {p.id === room.hostId && '👑'}
                   </div>
                 ))}
               </div>
            </div>
          )}

          {room.status === 'ended' && (
            <div className="card animate-bounce-in" style={{ textAlign: 'center', padding: '60px 20px' }}>
               <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🏆</div>
               <h2 className="glow-text" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Game Over</h2>
               <p style={{ color: 'var(--text-secondary)' }}>
                 {leaderboard[0] ? `${leaderboard[0].username} survived with ${leaderboard[0].score} points!` : 'Everyone died.'}
               </p>
            </div>
          )}

          {room.status === 'playing' && currentQuestion && (
            <div className="card animate-bounce-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
               
               {/* Timer Bar */}
               {!showReveal && (
                 <div style={{ width: '100%', height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${timerRatio * 100}%`, 
                      background: timerColor, 
                      transition: 'width 1s linear, background-color 0.5s ease',
                      boxShadow: `0 0 10px ${timerColor}` 
                    }} />
                 </div>
               )}

               <h2 style={{ fontSize: '1.6rem', lineHeight: '1.4' }}>{currentQuestion.question}</h2>
               
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                 {currentQuestion.options.map((opt, i) => {
                   const isSelected = selectedAnswer === opt;
                   
                   let btnClass = 'btn-ghost';
                   let borderColor = 'var(--border)';
                   
                   if (showReveal) {
                     if (opt === answerResult?.correctAnswer) {
                       btnClass = 'btn-primary';
                       borderColor = 'var(--green)';
                     } else if (isSelected) {
                       btnClass = 'btn-danger';
                       borderColor = 'var(--red)';
                     }
                   } else if (isSelected) {
                     btnClass = 'btn-primary';
                     borderColor = 'var(--accent-light)';
                   }

                   return (
                     <button 
                       key={i} 
                       className={`btn ${btnClass}`}
                       style={{ 
                         padding: '20px', 
                         height: 'auto', 
                         justifyContent: 'flex-start', 
                         textAlign: 'left',
                         fontSize: '1.1rem',
                         whiteSpace: 'normal',
                         border: `2px solid ${borderColor}`,
                         opacity: (showReveal && opt !== answerResult?.correctAnswer && !isSelected) ? 0.4 : 1
                       }}
                       disabled={!!selectedAnswer || showReveal || timeLeft === 0}
                       onClick={() => handleAnswerSubmit(opt)}
                     >
                       <span style={{ fontWeight: 'bold', marginRight: '12px', color: 'var(--text-secondary)' }}>
                         {['A','B','C','D'][i]}.
                       </span>
                       {opt}
                     </button>
                   );
                 })}
               </div>

               {/* Results feedback after answering */}
               {showReveal && answerResult && (
                 <div style={{ 
                   textAlign: 'center', 
                   padding: '16px', 
                   borderRadius: 'var(--radius)', 
                   background: answerResult.wasCorrect ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                   border: `1px solid ${answerResult.wasCorrect ? 'var(--green)' : 'var(--red)'}`,
                   color: answerResult.wasCorrect ? 'var(--green)' : 'var(--red)'
                 }}>
                   <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                     {answerResult.wasCorrect ? `+${answerResult.points} points! ⚡` : 'WRONG 💀'}
                   </span>
                 </div>
               )}

            </div>
          )}
        </div>


        {/* ── SIDEBAR (Leaderboard & Chat) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: 'calc(100vh - 120px)' }}>
          
          {/* Leaderboard */}
          <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '40%' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              Leaderboard
            </h3>
            <div className="divider" style={{ margin: '0' }} />
            
            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
              {leaderboard.map((p, i) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', borderRadius: '8px', background: p.id === session.id ? 'rgba(255,255,255,0.05)' : 'transparent' }}>
                  <div style={{ width: '24px', textAlign: 'center', fontWeight: 'bold', color: i === 0 ? 'var(--yellow)' : 'var(--text-secondary)' }}>
                    {i === 0 ? '👑' : `#${i+1}`}
                  </div>
                  <img src={p.avatar} alt="" className="avatar avatar-sm" style={{ border: !p.isOnline ? '2px solid var(--text-muted)' : '', opacity: !p.isOnline ? 0.5 : 1 }} />
                  <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '500', color: !p.isOnline ? 'var(--text-muted)' : 'white' }}>{p.username}</div>
                  </div>
                  <div style={{ fontWeight: 'bold', color: 'var(--accent-light)', fontFamily: 'var(--font-display)' }}>
                    {p.score}
                  </div>
                  {isHost && p.id !== session.id && (
                    <button className="btn-icon btn-ghost" onClick={() => handleKickPlayer(p.id)} title="Kick player" style={{ padding: '4px', color: 'var(--red)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              Trash Talk
            </h3>
            
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px', marginBottom: '12px' }}>
              {chatMessages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 'auto', marginBottom: 'auto' }}>
                  No one is talking yet... cowards.
                </div>
              ) : (
                chatMessages.map(msg => {
                  const isMe = msg.userId === session.id;
                  return (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                         <img src={msg.avatar} alt="" className="avatar avatar-sm" style={{ width: '20px', height: '20px' }} />
                         <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{msg.username}</span>
                      </div>
                      <div style={{ 
                        background: isMe ? 'var(--accent)' : 'var(--bg-secondary)', 
                        padding: '8px 12px', 
                        borderRadius: '12px',
                        borderTopRightRadius: isMe ? '2px' : '12px',
                        borderTopLeftRadius: !isMe ? '2px' : '12px',
                        fontSize: '0.9rem',
                        maxWidth: '90%',
                        wordBreak: 'break-word'
                      }}>
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendChat} style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
              <input 
                type="text" 
                className="input" 
                value={chatInput} 
                onChange={e => setChatInput(e.target.value)}
                placeholder="Talk smack..."
                style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                maxLength={200}
              />
              <button type="submit" className="btn btn-primary btn-sm" disabled={!chatInput.trim()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}

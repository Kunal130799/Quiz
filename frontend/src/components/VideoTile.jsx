import { useEffect, useRef } from 'react';

export default function VideoTile({ stream, username, isMe, isMuted }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="video-tile card" style={{ 
      position: 'relative', 
      overflow: 'hidden', 
      aspectRatio: '16/9',
      background: '#000',
      border: isMe ? '2px solid var(--accent)' : '1px solid var(--border)'
    }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isMe || isMuted}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <div style={{
        position: 'absolute',
        bottom: '8px',
        left: '8px',
        background: 'rgba(0,0,0,0.6)',
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '0.75rem',
        color: 'white'
      }}>
        {username} {isMe && '(You)'}
      </div>
    </div>
  );
}

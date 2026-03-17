import { useState, useEffect } from 'react';

export default function SafetyNotice({ onAccept }) {
  const [hasSpoken, setHasSpoken] = useState(false);

  useEffect(() => {
    // BGMI Style Voice Warning
    if (!hasSpoken) {
      const msg = new SpeechSynthesisUtterance();
      msg.text = "Welcome to the AI Quiz Game. This is a virtual world for fun and stress relief. Please play responsibly and respect all players. Inappropriate behavior will not be tolerated.";
      msg.rate = 0.9; // Slightly slower for that "official" feel
      msg.pitch = 1;
      window.speechSynthesis.speak(msg);
      setHasSpoken(true);
    }
  }, [hasSpoken]);

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal animate-bounce-in" style={{ maxWidth: '450px', border: '2px solid var(--accent)' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🛡️</div>
          <h2 className="glow-text">Play Fair & Stay Safe</h2>
        </div>

        <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
          <p>This is a <strong>virtual game environment</strong> designed for relaxation and fun.</p>
          <ul style={{ marginTop: '12px', paddingLeft: '20px', textAlign: 'left' }}>
            <li>Respect all players in <strong>Voice</strong> and <strong>Chat</strong>.</li>
            <li>No hate speech, harassment, or bullying.</li>
            <li>Keep the "vibe" positive and stress-free.</li>
            <li>Any inappropriate behavior may lead to being kicked.</li>
          </ul>
        </div>

        <button 
          className="btn btn-primary btn-full animate-glow" 
          onClick={onAccept}
          style={{ padding: '16px', fontSize: '1.1rem' }}
        >
          I UNDERSTAND & AGREE
        </button>
      </div>
    </div>
  );
}

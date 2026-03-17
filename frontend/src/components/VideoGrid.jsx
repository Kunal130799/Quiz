import VideoTile from './VideoTile';

export default function VideoGrid({ localStream, remoteStreams, players, session }) {
  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
      gap: '12px',
      marginBottom: '24px' 
    }}>
      {localStream && (
        <VideoTile 
          stream={localStream} 
          username={session.username} 
          isMe={true} 
        />
      )}
      {Object.entries(remoteStreams).map(([socketId, stream]) => {
        const player = players.find(p => p.socketId === socketId);
        return (
          <VideoTile 
            key={socketId}
            stream={stream} 
            username={player?.username || 'Guest'} 
            isMe={false} 
          />
        );
      })}
    </div>
  );
}

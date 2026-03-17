const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());

// ─── In-Memory State ──────────────────────────────────────────────────────────
// sessions: { sessionId -> { id, username, avatar, roomId } }
const sessions = {};
// rooms: { roomId -> Room }
const rooms = {};

/*
Room shape:
{
  id, code, name, hostId, topic,
  status: 'waiting' | 'playing' | 'ended',
  ...
}
*/

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateCode() {
  return uuidv4().replace(/-/g, '').substring(0, 6).toUpperCase();
}

function getLeaderboard(room) {
  return Object.values(room.players)
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({ rank: i + 1, id: p.id, username: p.username, avatar: p.avatar, score: p.score }));
}

function findRoomByCode(code) {
  return Object.values(rooms).find(r => r.code === code);
}

// ─── Session API ──────────────────────────────────────────────────────────────
app.post('/api/session', (req, res) => {
  const { username, avatar } = req.body;
  if (!username || username.trim().length < 2) {
    return res.status(400).json({ error: 'Username must be at least 2 characters.' });
  }
  const id = uuidv4();
  const session = { id, username: username.trim(), avatar: avatar || `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${encodeURIComponent(username)}`, roomId: null };
  sessions[id] = session;
  res.json({ session });
});

app.get('/api/session/:id', (req, res) => {
  const session = sessions[req.params.id];
  if (!session) return res.status(404).json({ error: 'Session not found.' });
  res.json({ session });
});

// ─── Room API ─────────────────────────────────────────────────────────────────
app.get('/api/rooms', (req, res) => {
  const list = Object.values(rooms)
    .filter(r => r.status === 'waiting')
    .map(r => ({
      id: r.id, code: r.code, name: r.name, topic: r.topic,
      playerCount: Object.keys(r.players).length, maxPlayers: r.maxPlayers,
      totalRounds: r.totalRounds,
    }));
  res.json({ rooms: list });
});

app.get('/api/rooms/:code', (req, res) => {
  const room = findRoomByCode(req.params.code.toUpperCase());
  if (!room) return res.status(404).json({ error: 'Room not found.' });
  res.json({ room: { id: room.id, code: room.code, name: room.name, topic: room.topic, status: room.status, playerCount: Object.keys(room.players).length, maxPlayers: room.maxPlayers, totalRounds: room.totalRounds, hostId: room.hostId } });
});

app.post('/api/rooms/:id/join', (req, res) => {
  const { sessionId } = req.body;
  const session = sessions[sessionId];
  if (!session) return res.status(401).json({ error: 'Invalid session.' });

  const room = rooms[req.params.id];
  if (!room) return res.status(404).json({ error: 'Room not found.' });
  if (room.status !== 'waiting') return res.status(400).json({ error: 'Game already started.' });
  if (Object.keys(room.players).length >= room.maxPlayers) return res.status(400).json({ error: 'Room is full.' });

  room.players[session.id] = { id: session.id, username: session.username, avatar: session.avatar, score: 0, isOnline: true, socketId: null };
  session.roomId = room.id;
  res.json({ success: true });
});

app.post('/api/rooms', (req, res) => {
  const { sessionId, name, maxPlayers, totalRounds, timePerQuestion, topic } = req.body;
  const session = sessions[sessionId];
  if (!session) return res.status(401).json({ error: 'Invalid session.' });

  const room = {
    id: uuidv4(),
    code: generateCode(),
    name: name || `${session.username}'s Room`,
    hostId: session.id,
    topic: topic || 'General Fun',
    status: 'waiting',
    maxPlayers: maxPlayers || 10,
    totalRounds: totalRounds || 5,
    currentRound: 0,
    timePerQuestion: timePerQuestion || 15,
    players: {},
    questions: [],
    currentQuestion: null,
    questionStartTime: null,
    answersThisRound: {},
    chatMessages: [],
  };

  // Add host as first player
  room.players[session.id] = { id: session.id, username: session.username, avatar: session.avatar, score: 0, isOnline: true, socketId: null };
  session.roomId = room.id;
  rooms[room.id] = room;

  res.json({ room: { id: room.id, code: room.code, name: room.name, topic: room.topic } });
});

// ─── OpenAI / AI Provider Initialization ─────────────────────────────────────
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1' 
}) : null;

async function generateQuestions(topic = 'General Fun', count = 1, previousQuestions = []) {
  if (!openai) {
    // ... (rest of fallback logic)

    const demoPool = [
      { question: "Why do we park on driveways and drive on parkways?", options: ['Philosophy', 'Just because', 'Life is weird', 'I give up'], correct_answer: 'Life is weird' },
      { question: "What do you call a fake noodle?", options: ['An Impasta', 'Spaghetti', 'Macaroni', 'Udon'], correct_answer: 'An Impasta' },
      { question: "Why did the scarecrow win an award?", options: ['He was outstanding in his field', 'He was scary', 'He was smart', 'He was tall'], correct_answer: 'He was outstanding in his field' },
      { question: "What has keys but can't open locks?", options: ['A piano', 'A map', 'A person', 'A door'], correct_answer: 'A piano' },
      { question: "What is orange and sounds like a parrot?", options: ['A carrot', 'An orange', 'A pumpkin', 'A sweet potato'], correct_answer: 'A carrot' }
    ];
    // Filter out already used ones if possible, else pick random
    const available = demoPool.filter(d => !previousQuestions.some(p => p.question === d.question));
    const pool = available.length > 0 ? available : demoPool;
    return [pool[Math.floor(Math.random() * pool.length)]];
  }

  const avoidList = previousQuestions.map(q => q.question).join('\n- ');
  const prompt = `You are a hilarious, whimsical, and encouraging game show host. Your goal is to provide stress-relief and pure fun.
Generate exactly ${count} multiple-choice quiz question(s) about the topic: "${topic}".

IMPORTANT: Do NOT repeat any of these questions:
- ${avoidList || 'None yet'}

Rules:
- Keep it lighthearted, funny, and engaging.
- Avoid stressful, academic, or controversial topics.
- Each question must have exactly 4 short, punchy answer options.
- Return ONLY a valid JSON array, absolutely no markdown or extra text.

Format:
[
  {
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "correct_answer": "..."
  }
]`;

  const completion = await openai.chat.completions.create({
    model: process.env.AI_MODEL || 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 1.0, 
    max_tokens: 1000,
  });

  const text = completion.choices[0].message.content.trim();
  const json = text.replace(/^```json?\n?/, '').replace(/```$/, '').trim();
  return JSON.parse(json);
}

// ─── Socket.io ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // ── Join Room ──
  socket.on('room:join', ({ sessionId, roomId }) => {
    const session = sessions[sessionId];
    const room = rooms[roomId];
    if (!session || !room) return;

    if (room.players[session.id]) {
      room.players[session.id].socketId = socket.id;
      room.players[session.id].isOnline = true;
    }

    socket.join(roomId);
    socket.data.sessionId = sessionId;
    socket.data.roomId = roomId;

    // Send current room state
    socket.emit('room:state', {
      room: {
        id: room.id, code: room.code, name: room.name, status: room.status,
        hostId: room.hostId, totalRounds: room.totalRounds, currentRound: room.currentRound,
        timePerQuestion: room.timePerQuestion, topic: room.topic,
        players: Object.values(room.players),
        chatMessages: room.chatMessages.slice(-50),
      }
    });

    // Notify others
    io.to(roomId).emit('room:player_joined', { player: room.players[session.id] });
    io.to(roomId).emit('room:players_update', { players: Object.values(room.players) });
  });

  // ── Admin: Start Game ──
  socket.on('game:start', async ({ sessionId, roomId }) => {
    const session = sessions[sessionId];
    const room = rooms[roomId];
    if (!session || !room || room.hostId !== session.id) return;
    if (room.status !== 'waiting') return;

    room.status = 'playing';
    room.currentRound = 0;

    io.to(roomId).emit('game:starting', { message: '🎃 Game is starting! Get ready for some dark fun...' });

    await startNextRound(room);
  });

  // ── Submit Answer ──
  socket.on('game:answer', ({ sessionId, roomId, answer }) => {
    const session = sessions[sessionId];
    const room = rooms[roomId];
    if (!session || !room || !room.currentQuestion) return;
    if (room.answersThisRound[session.id]) return; // already answered

    const isCorrect = answer === room.currentQuestion.correct_answer;
    const timeTaken = Date.now() - room.questionStartTime;
    const timeLimit = room.timePerQuestion * 1000;
    const timeLeft = Math.max(0, timeLimit - timeTaken);
    const speedBonus = isCorrect ? Math.floor((timeLeft / timeLimit) * 50) : 0;
    const points = isCorrect ? 100 + speedBonus : 0;

    room.answersThisRound[session.id] = { answer, isCorrect, timeTaken, points };
    room.players[session.id].score += points;

    socket.emit('game:answer_received', { correct: isCorrect, points, total: room.players[session.id].score });

    // Check if all players answered
    const playerCount = Object.keys(room.players).length;
    const answeredCount = Object.keys(room.answersThisRound).length;
    if (answeredCount >= playerCount) {
      clearRoundTimeout(roomId);
      revealAnswer(room);
    }
  });

  // ── Admin: Kick Player ──
  socket.on('room:kick', ({ sessionId, roomId, targetId }) => {
    const session = sessions[sessionId];
    const room = rooms[roomId];
    if (!session || !room || room.hostId !== session.id) return;
    if (targetId === session.id) return;

    const target = room.players[targetId];
    if (!target) return;

    delete room.players[targetId];
    if (sessions[targetId]) sessions[targetId].roomId = null;

    if (target.socketId) {
      const targetSocket = io.sockets.sockets.get(target.socketId);
      if (targetSocket) {
        targetSocket.emit('room:kicked', { message: 'You were kicked by the host.' });
        targetSocket.leave(roomId);
      }
    }

    io.to(roomId).emit('room:players_update', { players: Object.values(room.players) });
    io.to(roomId).emit('room:player_kicked', { username: target.username });
  });

  // ── Admin: Stop / End Game ──
  socket.on('game:stop', ({ sessionId, roomId }) => {
    const session = sessions[sessionId];
    const room = rooms[roomId];
    if (!session || !room || room.hostId !== session.id) return;
    endGame(room);
  });

  // ── Chat ──
  socket.on('chat:message', ({ sessionId, roomId, message, type }) => {
    const session = sessions[sessionId];
    const room = rooms[roomId];
    if (!session || !room) return;
    if (!message || message.trim().length === 0) return;

    const msg = {
      id: uuidv4(),
      userId: session.id,
      username: session.username,
      avatar: session.avatar,
      message: message.trim().substring(0, 300),
      type: type || 'text',
      timestamp: Date.now(),
    };

    room.chatMessages.push(msg);
    if (room.chatMessages.length > 200) room.chatMessages.shift();

    io.to(roomId).emit('chat:message', msg);
  });

  // ── WebRTC Signaling ──
  socket.on('webrtc:offer', ({ to, offer, sessionId }) => {
    const session = sessions[sessionId];
    if (!session) return;
    socket.to(to).emit('webrtc:offer', { from: socket.id, fromUser: { id: session.id, username: session.username, avatar: session.avatar }, offer });
  });

  socket.on('webrtc:answer', ({ to, answer }) => {
    socket.to(to).emit('webrtc:answer', { from: socket.id, answer });
  });

  socket.on('webrtc:ice_candidate', ({ to, candidate }) => {
    socket.to(to).emit('webrtc:ice_candidate', { from: socket.id, candidate });
  });

  socket.on('webrtc:leave_call', ({ roomId, sessionId }) => {
    io.to(roomId).emit('webrtc:peer_left', { socketId: socket.id });
  });

  // ── Disconnect ──
  socket.on('disconnect', () => {
    const { sessionId, roomId } = socket.data;
    if (!sessionId || !roomId) return;
    const session = sessions[sessionId];
    const room = rooms[roomId];
    if (session && room && room.players[session.id]) {
      room.players[session.id].isOnline = false;
      io.to(roomId).emit('room:players_update', { players: Object.values(room.players) });
    }
  });
});

// ─── Game Logic ───────────────────────────────────────────────────────────────
const roundTimeouts = {};

function clearRoundTimeout(roomId) {
  if (roundTimeouts[roomId]) {
    clearTimeout(roundTimeouts[roomId]);
    delete roundTimeouts[roomId];
  }
}

async function startNextRound(room) {
  room.currentRound += 1;
  room.answersThisRound = {};

  // Generate questions for this round if needed
  if (room.questions.length < room.currentRound) {
    try {
      io.to(room.id).emit('game:generating', { message: `🤖 AI is cooking up some ${room.topic} fun...` });
      const newQs = await generateQuestions(room.topic, 1, room.questions);
      room.questions.push(...newQs);
    } catch (err) {
      console.error('OpenAI error:', err.message);
      const fallbacks = [
        { question: 'What do you call a skeleton who tells jokes?', options: ['A Humerus', 'A Skull-Joker', 'Bag of Bones', 'DeadPool'], correct_answer: 'A Humerus' },
        { question: 'What do you call a bear with no teeth?', options: ['A gummy bear', 'A polar bear', 'A panda', 'A grizzly'], correct_answer: 'A gummy bear' },
        { question: 'What do you call a pile of kittens?', options: ['A meowntain', 'A litter', 'A group', 'A cuddle'], correct_answer: 'A meowntain' }
      ];
      const unused = fallbacks.filter(f => !room.questions.some(q => q.question === f.question));
      const picked = unused.length > 0 ? unused[0] : fallbacks[0];
      room.questions.push(picked);
    }
  }

  const question = room.questions[room.currentRound - 1];
  room.currentQuestion = question;
  room.questionStartTime = Date.now();

  io.to(room.id).emit('game:question', {
    round: room.currentRound,
    total: room.totalRounds,
    question: question.question,
    options: question.options,
    timePerQuestion: room.timePerQuestion,
  });

  // Auto-reveal after time limit
  roundTimeouts[room.id] = setTimeout(() => {
    revealAnswer(room);
  }, room.timePerQuestion * 1000 + 500);
}

function revealAnswer(room) {
  if (!room.currentQuestion) return;

  io.to(room.id).emit('game:reveal', {
    correct_answer: room.currentQuestion.correct_answer,
    answers: room.answersThisRound,
    leaderboard: getLeaderboard(room),
  });

  room.currentQuestion = null;

  if (room.currentRound >= room.totalRounds) {
    setTimeout(() => endGame(room), 5000);
  } else {
    setTimeout(() => startNextRound(room), 5000);
  }
}

function endGame(room) {
  clearRoundTimeout(room.id);
  room.status = 'ended';
  io.to(room.id).emit('game:end', {
    leaderboard: getLeaderboard(room),
    message: '💀 Game Over! The survivors have been ranked.',
  });
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', rooms: Object.keys(rooms).length, sessions: Object.keys(sessions).length }));

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🎮 AI Quiz Game server running on port ${PORT}`));

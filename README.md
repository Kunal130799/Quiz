# 🎮 Quiz AI: Stress-Relief Edition

A real-time, multiplayer quiz experience where an AI Game Master cooks up hilarious and stress-relieving questions on the fly!

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/frontend-React%2019-61dafb.svg)
![Node](https://img.shields.io/badge/backend-Node.js-339933.svg)
![Socket.io](https://img.shields.io/badge/realtime-Socket.io-010101.svg)
![AI](https://img.shields.io/badge/AI-Groq%20%2F%20LLaMA3-orange.svg)

## 🌟 Features

- **Whimsical AI Game Master**: Powered by Groq (LLaMA-3), our host is encouraging, funny, and slightly chaotic.
- **Real-Time Multiplayer**: Seamless room joining and real-time score tracking via WebSockets.
- **P2P Video Chat**: See your friends' reactions while you play using WebRTC.
- **Stress-Relief Categories**: Choose from "Dad Jokes," "90s Nostalgia," "Absurd Hypotheticals," and more!
- **Anti-Repeat Logic**: The AI never asks the same question twice in a single session.
- **Safety First**: Built-in "BGMI-style" safety notice and voice warning for a respectful environment.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Socket.io-client, WebRTC.
- **Backend**: Node.js, Express, Socket.io, OpenAI SDK (compatible with Groq).
- **AI Integration**: Groq Cloud API for near-instant question generation.

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18 or higher)
- A free [Groq API Key](https://console.groq.com/keys)

### 2. Installation
1. Clone the repo:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ai-quiz-game.git
   cd ai-quiz-game
   ```
2. Install dependencies:
   ```bash
   npm install
   cd frontend
   npm install
   cd ..
   ```

### 3. Configuration
Create a `.env` file in the root directory:
```env
PORT=4000
OPENAI_API_KEY=your_groq_api_key
OPENAI_BASE_URL=https://api.groq.com/openai/v1
AI_MODEL=llama-3.3-70b-versatile
FRONTEND_URL=http://localhost:5173
```

### 4. Run the App
**Start Backend:**
```bash
node server.js
```
**Start Frontend:**
```bash
cd frontend
npm run dev
```

## 🛡️ Code of Conduct
This project is designed for fun and relaxation. Please be respectful in chat and video. Inappropriate behavior will not be tolerated.

## 📄 License
This project is licensed under the MIT License.

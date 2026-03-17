# AI Quiz Game - Project Status & Architecture

This document tracks the core architecture, features, and recent changes to the AI Quiz Game.

## 🚀 Current Features
- **Multiplayer Engine**: Real-time room creation and joining using Socket.io.
- **AI Game Master**: Powered by OpenAI `gpt-4o-mini`, acting as a whimsical and encouraging host.
- **Stress-Relief Categories**: Pre-defined fun topics like "Dad Jokes," "90s Nostalgia," and "Absurd Hypotheticals."
- **WebRTC Video Chat**: P2P video/audio signaling implemented for live player interaction.
- **Anti-Repeat Logic**: Backend tracks `previousQuestions` in the room state to ensure the AI never asks the same question twice in a single game.
- **Robust Fallbacks**: A pool of funny demo questions ensures the game continues even if the OpenAI API is unavailable.

## 🛠 Tech Stack
- **Frontend**: React 19, Vite, Socket.io-client, WebRTC.
- **Backend**: Node.js, Express, Socket.io, OpenAI API.
- **Database**: None (In-memory state management).

## 📂 Key Files
- `server.js`: Central game logic, socket handlers, and AI prompt engineering.
- `frontend/src/hooks/useWebRTC.js`: Custom hook for P2P connection management.
- `frontend/src/pages/RoomPage.jsx`: Main game UI and state synchronization.
- `frontend/src/pages/HomePage.jsx`: Lobby management and category selection.

## 🔄 Recent Changes
- **[2026-03-17] WebRTC Integration**: Added full signaling support and `VideoGrid` component.
- **[2026-03-17] AI Topic Selection**: Implemented category-based room creation with specialized "stress-relief" prompts.
- **[2026-03-17] Anti-Repeat System**: Updated `generateQuestions` to accept a history of questions and filter out duplicates.
- **[2026-03-17] Dependency Fix**: Resolved `MODULE_NOT_FOUND` issues by re-initializing core backend dependencies.
- **[2026-03-17] Build Fix**: Fixed a missing `</>` tag in `RoomPage.jsx` that was causing Vercel deployment to fail. Verified locally with `npm run build`.

## 📋 Ongoing Tasks
- [ ] Improve UI/UX responsiveness for mobile devices.
- [ ] Add sound effects for correct/wrong answers.
- [ ] Implement "Host Migration" if the host leaves mid-game.

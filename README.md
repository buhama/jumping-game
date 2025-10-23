# Pixel Runner Game - Multiplayer Edition

A pixel-style endless runner game built with React, Three.js, and Socket.IO for real-time multiplayer functionality.

## Features

- Endless runner gameplay
- Real-time multiplayer with Socket.IO
- Score tracking and leaderboard
- Connection status indicator
- Online player counter
- Responsive design

## Tech Stack

### Frontend
- React 18
- Vite
- Socket.IO Client
- CSS3 Animations

### Backend
- Node.js
- Express
- Socket.IO Server

## Quick Start

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install server dependencies
npm run server:install
```

### 2. Run Locally

Open two terminal windows:

**Terminal 1 - Start the server:**
```bash
npm run server:dev
```
Server will run on `http://localhost:3000`

**Terminal 2 - Start the frontend:**
```bash
npm run dev
```
Frontend will run on `http://localhost:5173`

### 3. Play the Game

1. Open `http://localhost:5173` in your browser
2. Press **SPACE** or **Click** to jump
3. Avoid obstacles to increase your score
4. Open multiple tabs to see multiplayer in action

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions on deploying to:
- **Frontend**: Netlify
- **Backend**: Render

## Environment Variables

### Frontend (.env.local)
```env
VITE_SERVER_URL=http://localhost:3000
```

### Backend (server/.env)
```env
PORT=3000
CLIENT_URL=http://localhost:5173
```

For production, see [DEPLOYMENT.md](./DEPLOYMENT.md)

## Project Structure

```
pixel-runner-game/
├── server/                    # Socket.IO backend
│   ├── server.js             # Main server file
│   ├── package.json          # Server dependencies
│   └── .env                  # Server config (local)
├── src/
│   ├── components/
│   │   ├── Game.jsx          # Main game component
│   │   └── Game.css          # Game styles
│   ├── socket.js             # Socket.IO client setup
│   ├── App.jsx               # Root component
│   └── main.jsx              # Entry point
├── public/                   # Static assets
├── .env.local                # Frontend config (local)
├── package.json              # Frontend dependencies
└── vite.config.js            # Vite configuration
```

## Available Scripts

### Frontend
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Backend
- `npm run server:install` - Install server dependencies
- `npm run server:dev` - Start server in development mode
- `npm run server:start` - Start server in production mode

## Socket.IO Events

### Client → Server
- `playerJoin` - Player joins the game
- `playerMove` - Player position update
- `scoreUpdate` - Player score update
- `gameOver` - Player game over

### Server → Client
- `gameState` - Current game state
- `playerJoined` - New player joined
- `playerLeft` - Player disconnected
- `playerMoved` - Player moved
- `playerScoreUpdated` - Player score changed
- `playerGameOver` - Player finished game

## Game Controls

- **SPACE** or **Click** - Jump
- Avoid obstacles
- Survive as long as possible

## Development

### Adding New Features

1. **Client-side**: Edit `src/components/Game.jsx`
2. **Server-side**: Edit `server/server.js`
3. **Styling**: Edit `src/components/Game.css`

### Testing Multiplayer Locally

1. Start the server: `npm run server:dev`
2. Start the frontend: `npm run dev`
3. Open multiple browser tabs/windows
4. Play in each tab to see real-time updates

## Troubleshooting

### Can't connect to server
- Ensure server is running on port 3000
- Check `VITE_SERVER_URL` in `.env.local`
- Check browser console for errors

### CORS errors
- Verify `CLIENT_URL` in `server/.env`
- Ensure server CORS config includes your frontend URL

### Server won't start
- Check if port 3000 is already in use
- Run: `lsof -ti:3000 | xargs kill -9` to free the port
- Verify all dependencies are installed

## License

MIT

## Contributing

Pull requests are welcome! For major changes, please open an issue first.

---

**Built with ❤️ using React and Socket.IO**

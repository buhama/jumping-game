import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);

// Use environment variable for port, fallback to 3000 for local development
const PORT = process.env.PORT || 3000;

// Configure CORS for Socket.IO
const io = new Server(server, {
  cors: {
    origin: [
      process.env.CLIENT_URL || 'http://localhost:5173', // Vite dev server
      'https://*.netlify.app', // Your Netlify deployment
      'https://*.vercel.app'   // In case you switch to Vercel
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Store connected players
const players = new Map();
const gameState = {
  players: {},
  startTime: Date.now()
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Send current game state to new player
  socket.emit('gameState', gameState);

  // Handle player joining
  socket.on('playerJoin', (playerData) => {
    players.set(socket.id, {
      id: socket.id,
      ...playerData,
      connectedAt: Date.now()
    });

    gameState.players[socket.id] = {
      id: socket.id,
      ...playerData
    };

    // Notify all clients about new player
    io.emit('playerJoined', {
      id: socket.id,
      ...playerData
    });

    console.log(`Player ${socket.id} joined the game`);
  });

  // Handle player movement updates
  socket.on('playerMove', (moveData) => {
    if (players.has(socket.id)) {
      const player = players.get(socket.id);
      player.position = moveData.position;

      gameState.players[socket.id] = {
        ...gameState.players[socket.id],
        position: moveData.position
      };

      // Broadcast to other players
      socket.broadcast.emit('playerMoved', {
        id: socket.id,
        position: moveData.position
      });
    }
  });

  // Handle score updates
  socket.on('scoreUpdate', (scoreData) => {
    if (players.has(socket.id)) {
      const player = players.get(socket.id);
      player.score = scoreData.score;

      gameState.players[socket.id] = {
        ...gameState.players[socket.id],
        score: scoreData.score
      };

      // Broadcast to all players
      io.emit('playerScoreUpdated', {
        id: socket.id,
        score: scoreData.score
      });

      console.log(`Player ${socket.id} score: ${scoreData.score}`);
    }
  });

  // Handle game over
  socket.on('gameOver', (gameData) => {
    if (players.has(socket.id)) {
      io.emit('playerGameOver', {
        id: socket.id,
        finalScore: gameData.score
      });

      console.log(`Player ${socket.id} game over - Score: ${gameData.score}`);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    if (players.has(socket.id)) {
      players.delete(socket.id);
      delete gameState.players[socket.id];

      // Notify others
      io.emit('playerLeft', { id: socket.id });
      console.log(`Player disconnected: ${socket.id}`);
    }
  });
});

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    players: players.size,
    uptime: process.uptime()
  });
});

// API endpoint to get current players
app.get('/api/players', (req, res) => {
  res.json({
    count: players.size,
    players: Array.from(players.values())
  });
});

// Listen on all network interfaces (required for Render)
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🎮 Socket.IO server ready for connections`);
});

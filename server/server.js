import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);

// Use environment variable for port, fallback to 3000 for local development
const PORT = process.env.PORT || 3001;

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
  isStarted: false,
  startTime: null,
  startedBy: null
};

// Helper function to generate random player color
const generatePlayerColor = () => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
    '#F8B739', '#52B788', '#E76F51', '#2A9D8F'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Helper function to generate player name
const generatePlayerName = (socketId) => {
  const adjectives = ['Swift', 'Brave', 'Quick', 'Bold', 'Clever', 'Mighty', 'Lucky', 'Epic'];
  const nouns = ['Runner', 'Jumper', 'Player', 'Hero', 'Champion', 'Ninja', 'Star', 'Pro'];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adjective}${noun}${socketId.slice(-4)}`;
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Send current game state to new player
  socket.emit('gameState', {
    isStarted: gameState.isStarted,
    startTime: gameState.startTime,
    playersCount: players.size
  });

  // Handle player joining
  socket.on('playerJoin', (playerData) => {
    console.log(`Player attempting to join:`, playerData);

    const newPlayer = {
      id: socket.id,
      name: playerData.name || generatePlayerName(socket.id),
      color: playerData.color || generatePlayerColor(),
      position: 0,
      score: 0,
      isAlive: true,
      connectedAt: Date.now()
    };

    // Send EXISTING players to the new player (before adding them)
    const existingPlayers = Array.from(players.values());
    console.log(`Sending ${existingPlayers.length} existing players to new player ${newPlayer.name}`);
    socket.emit('currentPlayers', existingPlayers);

    // NOW add the new player
    players.set(socket.id, newPlayer);
    gameState.players[socket.id] = newPlayer;

    // Notify all OTHER clients about new player
    socket.broadcast.emit('playerJoined', newPlayer);

    console.log(`Player ${newPlayer.name} (${socket.id}) joined the game. Total players: ${players.size}`);
  });

  // Handle player movement updates
  socket.on('playerMove', (moveData) => {
    if (players.has(socket.id)) {
      const player = players.get(socket.id);
      player.position = moveData.position;
      player.isAlive = moveData.isAlive !== undefined ? moveData.isAlive : true;

      gameState.players[socket.id] = {
        ...gameState.players[socket.id],
        position: moveData.position,
        isAlive: player.isAlive
      };

      // Broadcast to other players
      socket.broadcast.emit('playerMoved', {
        id: socket.id,
        position: moveData.position,
        isAlive: player.isAlive
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

  // Handle game start
  socket.on('startGame', () => {
    if (!gameState.isStarted) {
      gameState.isStarted = true;
      gameState.startTime = Date.now();
      gameState.startedBy = socket.id;

      // Notify all players that the game has started
      io.emit('gameStarted', {
        startTime: gameState.startTime,
        startedBy: socket.id
      });

      console.log(`Game started by ${socket.id}`);
    }
  });

  // Handle game reset (for when all players are dead or want to restart)
  socket.on('resetGame', () => {
    gameState.isStarted = false;
    gameState.startTime = null;
    gameState.startedBy = null;

    // Reset all players
    players.forEach((player) => {
      player.score = 0;
      player.isAlive = true;
      player.position = 0;
    });

    io.emit('gameReset');
    console.log(`Game reset by ${socket.id}`);
  });

  // Handle game over
  socket.on('gameOver', (gameData) => {
    if (players.has(socket.id)) {
      const player = players.get(socket.id);
      player.isAlive = false;
      gameState.players[socket.id].isAlive = false;

      io.emit('playerGameOver', {
        id: socket.id,
        name: player.name,
        finalScore: gameData.score
      });

      console.log(`Player ${player.name} (${socket.id}) game over - Score: ${gameData.score}`);
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

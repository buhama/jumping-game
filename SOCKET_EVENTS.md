# Socket.IO Events Reference

This document describes all Socket.IO events used in the Pixel Runner Game.

## Connection Events

### Client → Server

#### `connect`
Automatically emitted when client connects to server.

**Handler Location**: `src/socket.js:13`

**Example**:
```javascript
socket.on('connect', () => {
  console.log('Connected to server:', socket.id);
});
```

---

#### `disconnect`
Automatically emitted when client disconnects from server.

**Handler Location**: `src/socket.js:17`

**Example**:
```javascript
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});
```

---

## Game Events

### Client → Server (Emitted by Client)

#### `playerJoin`
Sent when a player joins the game.

**Payload**:
```javascript
{
  timestamp: Date.now()
}
```

**Emitted From**: `src/components/Game.jsx:35`

**Handler**: `server/server.js:29`

**Example**:
```javascript
socket.emit('playerJoin', {
  timestamp: Date.now()
});
```

---

#### `playerMove`
Sent when player position changes (jumping).

**Payload**:
```javascript
{
  position: 150  // Y position in pixels
}
```

**Emitted From**: `src/components/Game.jsx:113`

**Handler**: `server/server.js:47`

**Example**:
```javascript
socket.emit('playerMove', {
  position: playerY
});
```

---

#### `scoreUpdate`
Sent when player's score changes.

**Payload**:
```javascript
{
  score: 1234
}
```

**Emitted From**: `src/components/Game.jsx:106`

**Handler**: `server/server.js:66`

**Example**:
```javascript
socket.emit('scoreUpdate', {
  score: currentScore
});
```

---

#### `gameOver`
Sent when player's game ends.

**Payload**:
```javascript
{
  score: 1234  // Final score
}
```

**Emitted From**: `src/components/Game.jsx:215`

**Handler**: `server/server.js:84`

**Example**:
```javascript
socket.emit('gameOver', {
  score: finalScore
});
```

---

### Server → Client (Received by Client)

#### `gameState`
Sent to new players with current game state.

**Payload**:
```javascript
{
  players: {
    "socket-id-1": {
      id: "socket-id-1",
      score: 100,
      position: 0
    },
    "socket-id-2": {
      id: "socket-id-2",
      score: 200,
      position: 50
    }
  },
  startTime: 1234567890
}
```

**Sent From**: `server/server.js:28`

**Handler**: `src/components/Game.jsx:45`

---

#### `playerJoined`
Broadcast when a new player joins.

**Payload**:
```javascript
{
  id: "socket-id",
  timestamp: 1234567890
}
```

**Sent From**: `server/server.js:39`

**Handler**: `src/components/Game.jsx:49`

---

#### `playerLeft`
Broadcast when a player disconnects.

**Payload**:
```javascript
{
  id: "socket-id"
}
```

**Sent From**: `server/server.js:105`

**Handler**: `src/components/Game.jsx:57`

---

#### `playerMoved`
Broadcast when a player moves (to other players only).

**Payload**:
```javascript
{
  id: "socket-id",
  position: 150
}
```

**Sent From**: `server/server.js:59`

**Handler**: `src/components/Game.jsx:66`

---

#### `playerScoreUpdated`
Broadcast when any player's score changes.

**Payload**:
```javascript
{
  id: "socket-id",
  score: 1234
}
```

**Sent From**: `server/server.js:78`

**Handler**: `src/components/Game.jsx:76`

---

#### `playerGameOver`
Broadcast when a player's game ends.

**Payload**:
```javascript
{
  id: "socket-id",
  finalScore: 1234
}
```

**Sent From**: `server/server.js:91`

**Handler**: `src/components/Game.jsx:86`

---

## Event Flow Examples

### When a Player Joins

```
Client                          Server                          Other Clients
  |                               |                                    |
  |--- connect ------------------>|                                    |
  |<-- connect event -------------|                                    |
  |                               |                                    |
  |--- playerJoin --------------->|                                    |
  |                               |--- playerJoined ------------------>|
  |<-- gameState -----------------|                                    |
```

---

### When a Player Moves

```
Client                          Server                          Other Clients
  |                               |                                    |
  |--- playerMove --------------->|                                    |
  |                               |--- playerMoved ------------------->|
  |                               |    (broadcast to others)           |
```

---

### When a Player Updates Score

```
Client                          Server                          Other Clients
  |                               |                                    |
  |--- scoreUpdate -------------->|                                    |
  |                               |--- playerScoreUpdated ------------>|
  |<-- playerScoreUpdated --------|    (broadcast to all including    |
  |                               |     sender)                        |
```

---

### When a Player's Game Ends

```
Client                          Server                          Other Clients
  |                               |                                    |
  |--- gameOver ----------------->|                                    |
  |                               |--- playerGameOver ---------------->|
  |<-- playerGameOver ------------|    (broadcast to all)              |
```

---

### When a Player Disconnects

```
Client                          Server                          Other Clients
  |                               |                                    |
  |--- disconnect --------------->|                                    |
  |                               |--- playerLeft -------------------->|
  |                               |    (broadcast to others)           |
```

---

## Testing Events

### Using Browser Console

```javascript
// Listen to all events
socket.onAny((eventName, ...args) => {
  console.log(`Event: ${eventName}`, args);
});

// Manually emit an event
socket.emit('scoreUpdate', { score: 9999 });

// Check connection status
console.log('Connected:', socket.connected);
console.log('Socket ID:', socket.id);
```

---

## Server API Endpoints

In addition to Socket.IO events, the server provides HTTP endpoints:

### `GET /health`
Returns server health status.

**Response**:
```json
{
  "status": "ok",
  "players": 5,
  "uptime": 12345.67
}
```

---

### `GET /api/players`
Returns list of connected players.

**Response**:
```json
{
  "count": 2,
  "players": [
    {
      "id": "socket-id-1",
      "score": 100,
      "connectedAt": 1234567890
    },
    {
      "id": "socket-id-2",
      "score": 200,
      "connectedAt": 1234567891
    }
  ]
}
```

---

## Event Best Practices

1. **Always check connection status** before emitting events
2. **Clean up listeners** when components unmount
3. **Don't emit events too frequently** (position updates are throttled by game loop)
4. **Use meaningful event names** that describe the action
5. **Include only necessary data** in payloads
6. **Handle disconnections gracefully** on the client

---

**For more info, see**:
- `src/socket.js` - Socket.IO client setup
- `src/components/Game.jsx` - Client-side event handlers
- `server/server.js` - Server-side event handlers

import React, { useState, useEffect, useRef } from 'react'
import { socket } from '../socket'
import './Game.css'

const Game = () => {
  const [isJumping, setIsJumping] = useState(false)
  const [isGameOver, setIsGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [obstacles, setObstacles] = useState([])
  const [playerY, setPlayerY] = useState(0)
  const [otherPlayers, setOtherPlayers] = useState({})
  const [isConnected, setIsConnected] = useState(socket.connected)
  const [localPlayerId, setLocalPlayerId] = useState(null)
  const [localPlayerData, setLocalPlayerData] = useState({ name: '', color: '#FF6B6B' })
  const [gameStarted, setGameStarted] = useState(false)
  const [inLobby, setInLobby] = useState(true)

  const gameRef = useRef(null)
  const obstacleIdRef = useRef(0)
  const gameLoopRef = useRef(null)
  const scoreIntervalRef = useRef(null)

  const PLAYER_X = 50
  const PLAYER_SIZE = 40
  const OBSTACLE_WIDTH = 20
  const OBSTACLE_HEIGHT = 40
  const GROUND_HEIGHT = 100
  const JUMP_HEIGHT = 150
  const JUMP_DURATION = 600
  const GRAVITY = 5
  const GAME_SPEED = 5

  // Socket.IO connection and event handlers
  useEffect(() => {
    // Connection handlers
    socket.on('connect', () => {
      setIsConnected(true)
      setLocalPlayerId(socket.id)

      // Generate player data
      const playerData = {
        timestamp: Date.now()
      }

      // Join game with player data
      socket.emit('playerJoin', playerData)
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
      setLocalPlayerId(null)
    })

    // Game state handlers
    socket.on('gameState', (state) => {
      console.log('Received game state:', state)
      if (state.isStarted) {
        setGameStarted(true)
        setInLobby(false)
      }
    })

    // Handle game started event
    socket.on('gameStarted', (data) => {
      console.log('Game started!', data)
      setGameStarted(true)
      setInLobby(false)
    })

    // Handle game reset event
    socket.on('gameReset', () => {
      console.log('Game reset!')
      setGameStarted(false)
      setInLobby(true)
      setIsGameOver(false)
      setScore(0)
      setObstacles([])
      setPlayerY(0)
      setIsJumping(false)
    })

    // Receive all current players when joining
    socket.on('currentPlayers', (players) => {
      console.log('Current players:', players)
      const playersMap = {}
      players.forEach(player => {
        if (player.id !== socket.id) {
          playersMap[player.id] = player
        } else {
          // This is us!
          setLocalPlayerData({
            name: player.name,
            color: player.color
          })
        }
      })
      setOtherPlayers(playersMap)
    })

    socket.on('playerJoined', (player) => {
      console.log('Player joined:', player.name, player.id)
      if (player.id !== socket.id) {
        setOtherPlayers(prev => ({
          ...prev,
          [player.id]: { ...player, position: 0, score: 0 }
        }))
      }
    })

    socket.on('playerLeft', ({ id }) => {
      console.log('Player left:', id)
      setOtherPlayers(prev => {
        const updated = { ...prev }
        delete updated[id]
        return updated
      })
    })

    socket.on('playerMoved', ({ id, position, isAlive }) => {
      setOtherPlayers(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          position,
          isAlive
        }
      }))
    })

    socket.on('playerScoreUpdated', ({ id, score }) => {
      setOtherPlayers(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          score
        }
      }))
    })

    socket.on('playerGameOver', ({ id, name, finalScore }) => {
      console.log(`Player ${name} game over - Score: ${finalScore}`)
      setOtherPlayers(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          isAlive: false
        }
      }))
    })

    // Cleanup
    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('gameState')
      socket.off('gameStarted')
      socket.off('gameReset')
      socket.off('currentPlayers')
      socket.off('playerJoined')
      socket.off('playerLeft')
      socket.off('playerMoved')
      socket.off('playerScoreUpdated')
      socket.off('playerGameOver')
    }
  }, [])

  // Start game function
  const handleStartGame = () => {
    socket.emit('startGame')
  }

  // Reset game function
  const handleResetGame = () => {
    socket.emit('resetGame')
  }

  // Emit score updates to server
  useEffect(() => {
    if (isConnected && score > 0) {
      socket.emit('scoreUpdate', { score })
    }
  }, [score, isConnected])

  // Emit player position updates
  useEffect(() => {
    if (isConnected) {
      socket.emit('playerMove', {
        position: playerY,
        isAlive: !isGameOver
      })
    }
  }, [playerY, isConnected, isGameOver])

  useEffect(() => {
    if (!isGameOver && gameStarted) {
      const handleKeyPress = (e) => {
        if (e.code === 'Space' && !isJumping) {
          jump()
        }
      }

      const handleClick = () => {
        if (!isJumping) {
          jump()
        }
      }

      window.addEventListener('keydown', handleKeyPress)
      window.addEventListener('click', handleClick)

      return () => {
        window.removeEventListener('keydown', handleKeyPress)
        window.removeEventListener('click', handleClick)
      }
    }
  }, [isJumping, isGameOver, gameStarted])

  const jump = () => {
    if (isGameOver) return

    setIsJumping(true)
    let jumpProgress = 0
    const jumpInterval = setInterval(() => {
      jumpProgress += 20

      if (jumpProgress <= JUMP_DURATION / 2) {
        setPlayerY(prev => Math.min(prev + 8, JUMP_HEIGHT))
      } else {
        setPlayerY(prev => Math.max(prev - 8, 0))
      }

      if (jumpProgress >= JUMP_DURATION) {
        clearInterval(jumpInterval)
        setPlayerY(0)
        setIsJumping(false)
      }
    }, 20)
  }

  useEffect(() => {
    if (!isGameOver && gameStarted) {
      const obstacleInterval = setInterval(() => {
        createObstacle()
      }, 2000)

      return () => clearInterval(obstacleInterval)
    }
  }, [isGameOver, gameStarted])

  const createObstacle = () => {
    const newObstacle = {
      id: obstacleIdRef.current++,
      x: 800
    }
    setObstacles(prev => [...prev, newObstacle])
  }

  useEffect(() => {
    if (!isGameOver && gameStarted) {
      gameLoopRef.current = setInterval(() => {
        setObstacles(prev => {
          const updated = prev.map(obstacle => ({
            ...obstacle,
            x: obstacle.x - GAME_SPEED
          })).filter(obstacle => obstacle.x > -OBSTACLE_WIDTH)

          return updated
        })
      }, 1000 / 60)

      return () => clearInterval(gameLoopRef.current)
    }
  }, [isGameOver, gameStarted])

  useEffect(() => {
    if (!isGameOver && gameStarted) {
      scoreIntervalRef.current = setInterval(() => {
        setScore(prev => prev + 1)
      }, 100)

      return () => clearInterval(scoreIntervalRef.current)
    }
  }, [isGameOver, gameStarted])

  useEffect(() => {
    if (!isGameOver && gameStarted) {
      obstacles.forEach(obstacle => {
        if (checkCollision(obstacle)) {
          setIsGameOver(true)
          // Emit game over to server
          if (isConnected) {
            socket.emit('gameOver', { score })
          }
        }
      })
    }
  }, [obstacles, playerY, isGameOver, score, isConnected, gameStarted])

  const checkCollision = (obstacle) => {
    const playerLeft = PLAYER_X
    const playerRight = PLAYER_X + PLAYER_SIZE
    const playerTop = GROUND_HEIGHT - PLAYER_SIZE - playerY
    const playerBottom = GROUND_HEIGHT - playerY

    const obstacleLeft = obstacle.x
    const obstacleRight = obstacle.x + OBSTACLE_WIDTH
    const obstacleTop = GROUND_HEIGHT - OBSTACLE_HEIGHT
    const obstacleBottom = GROUND_HEIGHT

    return (
      playerRight > obstacleLeft &&
      playerLeft < obstacleRight &&
      playerBottom > obstacleTop &&
      playerTop < obstacleBottom
    )
  }

  const restartGame = () => {
    handleResetGame()
  }

  // Get sorted leaderboard
  const getLeaderboard = () => {
    const allPlayers = [
      {
        id: localPlayerId,
        name: localPlayerData.name || 'You',
        score,
        isLocal: true,
        isAlive: !isGameOver,
        color: localPlayerData.color
      },
      ...Object.values(otherPlayers).map(p => ({
        ...p,
        isLocal: false
      }))
    ]
    return allPlayers.sort((a, b) => (b.score || 0) - (a.score || 0))
  }

  // Get total player count (fixed to not count yourself twice)
  const getTotalPlayers = () => {
    return Object.keys(otherPlayers).length + 1
  }

  // Render lobby screen
  if (inLobby && !gameStarted) {
    return (
      <div className="game-container">
        <div className="lobby-container">
          <h1 className="lobby-title">Pixel Runner - Multiplayer</h1>

          <div className="lobby-info">
            <div className="connection-badge">
              <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
              </span>
            </div>

            <div className="player-info-box">
              <h3>You are:</h3>
              <div className="your-player">
                <div
                  className="player-preview"
                  style={{ borderColor: localPlayerData.color }}
                />
                <span className="your-name" style={{ color: localPlayerData.color }}>
                  {localPlayerData.name || 'Connecting...'}
                </span>
              </div>
            </div>
          </div>

          <div className="waiting-players">
            <h3>Players in Lobby ({getTotalPlayers()})</h3>
            <div className="player-list">
              <div className="player-item local-player-item">
                <span className="player-dot" style={{ backgroundColor: localPlayerData.color }} />
                <span className="player-name">{localPlayerData.name || 'You'} (You)</span>
              </div>
              {Object.values(otherPlayers).map(player => (
                <div key={player.id} className="player-item">
                  <span className="player-dot" style={{ backgroundColor: player.color }} />
                  <span className="player-name">{player.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lobby-controls">
            <button
              className="start-game-button"
              onClick={handleStartGame}
              disabled={!isConnected}
            >
              Start Game
            </button>
            <p className="lobby-hint">Any player can start the game for everyone</p>
          </div>

          <div className="game-instructions">
            <h4>How to Play:</h4>
            <ul>
              <li>Press SPACE or Click to jump</li>
              <li>Avoid obstacles to survive</li>
              <li>Compete for the highest score</li>
              <li>See all players in real-time</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="game-container">
      <div className="score-board">
        <div className="score-info">
          <div className="player-name" style={{ color: localPlayerData.color }}>
            {localPlayerData.name || 'You'}
          </div>
          <div className="score-value">Score: {score}</div>
        </div>
        <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </span>
      </div>

      <div className="game-layout">
        <div className="game-canvas" ref={gameRef}>
          {/* Render other players FIRST (lower z-index) */}
          {Object.entries(otherPlayers).map(([id, player]) => (
            <div
              key={id}
              className={`player other-player ${!player.isAlive ? 'dead' : ''}`}
              style={{
                bottom: `${player.position || 0}px`,
                left: `${PLAYER_X}px`,
                opacity: player.isAlive === false ? 0.3 : 0.6,
                zIndex: 1,
                borderColor: player.color
              }}
              title={`${player.name} - Score: ${player.score || 0}`}
            >
              <div className="player-label" style={{ color: player.color }}>
                {player.name}
              </div>
            </div>
          ))}

          {/* Render local player LAST (highest z-index) */}
          <div
            className="player local-player"
            style={{
              bottom: `${playerY}px`,
              left: `${PLAYER_X}px`,
              zIndex: 10,
              borderColor: localPlayerData.color
            }}
          >
            <div className="player-label" style={{ color: localPlayerData.color }}>
              {localPlayerData.name || 'You'}
            </div>
          </div>

          {obstacles.map(obstacle => (
            <div
              key={obstacle.id}
              className="obstacle"
              style={{
                left: `${obstacle.x}px`,
                bottom: '0px'
              }}
            />
          ))}

          <div className="ground" />

          {isGameOver && (
            <div className="game-over-overlay">
              <div className="game-over-text">Game Over!</div>
              <div className="final-score">Final Score: {score}</div>
              <button className="restart-button" onClick={restartGame}>
                Restart
              </button>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="leaderboard">
          <h3>Leaderboard</h3>
          <div className="leaderboard-list">
            {getLeaderboard().map((player, index) => (
              <div
                key={player.id}
                className={`leaderboard-item ${player.isLocal ? 'local' : ''} ${!player.isAlive ? 'dead' : ''}`}
              >
                <span className="rank">#{index + 1}</span>
                <span
                  className="player-dot"
                  style={{ backgroundColor: player.color }}
                />
                <span className="player-name-lb">
                  {player.name} {player.isLocal && '(You)'}
                </span>
                <span className="player-score">{player.score || 0}</span>
                {!player.isAlive && <span className="status-dead">💀</span>}
              </div>
            ))}
          </div>
          <div className="players-count">
            {getTotalPlayers()} player(s) online
          </div>
        </div>
      </div>

      <div className="instructions">
        Press SPACE or Click to Jump
      </div>
    </div>
  )
}

export default Game

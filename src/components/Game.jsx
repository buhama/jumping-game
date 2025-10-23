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
      // Join game with player data
      socket.emit('playerJoin', {
        timestamp: Date.now()
      })
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    // Game state handlers
    socket.on('gameState', (state) => {
      console.log('Received game state:', state)
    })

    socket.on('playerJoined', (player) => {
      console.log('Player joined:', player.id)
      setOtherPlayers(prev => ({
        ...prev,
        [player.id]: player
      }))
    })

    socket.on('playerLeft', ({ id }) => {
      console.log('Player left:', id)
      setOtherPlayers(prev => {
        const updated = { ...prev }
        delete updated[id]
        return updated
      })
    })

    socket.on('playerMoved', ({ id, position }) => {
      setOtherPlayers(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          position
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

    socket.on('playerGameOver', ({ id, finalScore }) => {
      console.log(`Player ${id} game over - Score: ${finalScore}`)
    })

    // Cleanup
    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('gameState')
      socket.off('playerJoined')
      socket.off('playerLeft')
      socket.off('playerMoved')
      socket.off('playerScoreUpdated')
      socket.off('playerGameOver')
    }
  }, [])

  // Emit score updates to server
  useEffect(() => {
    if (isConnected && score > 0) {
      socket.emit('scoreUpdate', { score })
    }
  }, [score, isConnected])

  // Emit player position updates
  useEffect(() => {
    if (isConnected) {
      socket.emit('playerMove', { position: playerY })
    }
  }, [playerY, isConnected])

  useEffect(() => {
    if (!isGameOver) {
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
  }, [isJumping, isGameOver])

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
    if (!isGameOver) {
      const obstacleInterval = setInterval(() => {
        createObstacle()
      }, 2000)

      return () => clearInterval(obstacleInterval)
    }
  }, [isGameOver])

  const createObstacle = () => {
    const newObstacle = {
      id: obstacleIdRef.current++,
      x: 800
    }
    setObstacles(prev => [...prev, newObstacle])
  }

  useEffect(() => {
    if (!isGameOver) {
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
  }, [isGameOver])

  useEffect(() => {
    if (!isGameOver) {
      scoreIntervalRef.current = setInterval(() => {
        setScore(prev => prev + 1)
      }, 100)

      return () => clearInterval(scoreIntervalRef.current)
    }
  }, [isGameOver])

  useEffect(() => {
    if (!isGameOver) {
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
  }, [obstacles, playerY, isGameOver, score, isConnected])

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
    setIsGameOver(false)
    setScore(0)
    setObstacles([])
    setPlayerY(0)
    setIsJumping(false)
  }

  return (
    <div className="game-container">
      <div className="score-board">
        Score: {score}
        <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </span>
        {Object.keys(otherPlayers).length > 0 && (
          <span className="players-online">
            👥 {Object.keys(otherPlayers).length} player(s) online
          </span>
        )}
      </div>
      <div className="game-canvas" ref={gameRef}>
        <div
          className="player"
          style={{
            bottom: `${playerY}px`,
            left: `${PLAYER_X}px`
          }}
        />

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
      <div className="instructions">
        Press SPACE or Click to Jump
      </div>
    </div>
  )
}

export default Game

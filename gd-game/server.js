import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import next from 'next';
import { GameManager } from './src/lib/gameManager.js';

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000', 10);

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('⚠️  WARNING: ANTHROPIC_API_KEY is not set. AI features will fail.');
}

const app = next({ dev, hostname: 'localhost', port });
const handle = app.getRequestHandler();
const gameManager = new GameManager(process.env.ANTHROPIC_API_KEY || '');

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      await handle(req, res);
    } catch (err) {
      console.error('Next.js handler error:', err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    maxHttpBufferSize: 1e5, // 100KB max message size
  });

  io.on('connection', (socket) => {
    let currentRoomId = null;

    socket.on('get-rooms', (callback) => {
      if (typeof callback !== 'function') return;
      try {
        callback({ rooms: gameManager.getRooms() });
      } catch (err) {
        callback({ error: 'Failed to get rooms' });
      }
    });

    socket.on('create-room', (config, callback) => {
      if (typeof callback !== 'function') return;
      try {
        if (!config || typeof config !== 'object') return callback({ error: 'Invalid config' });
        if (!config.topic || typeof config.topic !== 'string' || config.topic.trim().length < 5) {
          return callback({ error: 'Topic must be at least 5 characters' });
        }
        if (config.topic.length > 300) return callback({ error: 'Topic too long' });

        const room = gameManager.createRoom(config);
        io.emit('rooms-updated', { rooms: gameManager.getRooms() });
        callback({ room });
      } catch (err) {
        console.error('create-room error:', err);
        callback({ error: 'Failed to create room' });
      }
    });

    socket.on('join-room', ({ roomId, humanName } = {}, callback) => {
      if (typeof callback !== 'function') return;
      try {
        if (!roomId || typeof roomId !== 'string') return callback({ error: 'Invalid room ID' });

        const room = gameManager.getRoom(roomId);
        if (!room) return callback({ error: 'Room not found' });

        socket.join(roomId);
        currentRoomId = roomId;

        if (humanName && typeof humanName === 'string') {
          gameManager.setHumanName(roomId, humanName.trim().slice(0, 50));
        }

        callback({ room: gameManager.getRoomPublic(roomId) });
      } catch (err) {
        console.error('join-room error:', err);
        callback({ error: 'Failed to join room' });
      }
    });

    socket.on('start-game', ({ roomId } = {}) => {
      try {
        if (!roomId || typeof roomId !== 'string') return;
        const room = gameManager.getRoom(roomId);
        if (!room) return;

        gameManager.startGame(roomId, (event, data) => {
          io.to(roomId).emit(event, data);
        });
      } catch (err) {
        console.error('start-game error:', err);
        socket.emit('game-error', { message: 'Failed to start game. Check server logs.' });
      }
    });

    socket.on('human-speech', ({ roomId, text } = {}) => {
      try {
        if (!roomId || !text || typeof text !== 'string') return;
        const sanitized = text.trim().slice(0, 1000);
        if (!sanitized) return;

        const message = gameManager.addHumanSpeech(roomId, sanitized);
        if (message) {
          io.to(roomId).emit('message-added', message);
        }
      } catch (err) {
        console.error('human-speech error:', err);
      }
    });

    socket.on('human-interrupt', ({ roomId } = {}) => {
      try {
        if (!roomId) return;
        gameManager.pauseForHuman(roomId);
        socket.to(roomId).emit('human-speaking', {});
      } catch (err) {
        console.error('human-interrupt error:', err);
      }
    });

    socket.on('human-done-speaking', ({ roomId } = {}) => {
      try {
        if (!roomId) return;
        gameManager.resumeAfterHuman(roomId);
        socket.to(roomId).emit('human-done', {});
      } catch (err) {
        console.error('human-done-speaking error:', err);
      }
    });

    socket.on('human-closing-done', ({ roomId } = {}) => {
      try {
        if (!roomId) return;
        gameManager.humanClosingDone(roomId);
      } catch (err) {
        console.error('human-closing-done error:', err);
      }
    });

    socket.on('skip-thinking', ({ roomId } = {}) => {
      try {
        if (!roomId) return;
        const room = gameManager.getRoom(roomId);
        if (!room || room.phase !== 'thinking') return;
        gameManager.skipThinking(roomId);
      } catch (err) {
        console.error('skip-thinking error:', err);
      }
    });

    // Client signals TTS playback is complete — this drives server timing
    socket.on('utterance-complete', ({ messageId } = {}) => {
      try {
        if (!messageId) return;
        gameManager.onUtteranceComplete(messageId);
      } catch (err) {
        console.error('utterance-complete error:', err);
      }
    });

    socket.on('get-reviews', ({ roomId } = {}, callback) => {
      if (typeof callback !== 'function') return;
      try {
        if (!roomId) return callback({ error: 'Invalid room ID' });
        const room = gameManager.getRoom(roomId);
        if (!room) return callback({ error: 'Room not found' });

        callback({
          reviews: room.reviews,
          room: gameManager.getRoomPublic(roomId),
        });
      } catch (err) {
        console.error('get-reviews error:', err);
        callback({ error: 'Failed to get reviews' });
      }
    });

    socket.on('leave-room', ({ roomId } = {}) => {
      try {
        if (roomId) {
          socket.leave(roomId);
          currentRoomId = null;
        }
      } catch (err) {
        console.error('leave-room error:', err);
      }
    });

    socket.on('disconnect', () => {
      // Rooms persist for other clients; game loop has its own timeout handling
    });

    socket.on('error', (err) => {
      console.error('Socket error:', err);
    });
  });

  // Periodic room cleanup: remove rooms older than 4 hours with completed reviews
  setInterval(() => {
    gameManager.cleanupOldRooms(4 * 60 * 60 * 1000);
    io.emit('rooms-updated', { rooms: gameManager.getRooms() });
  }, 30 * 60 * 1000); // every 30 minutes

  httpServer
    .once('error', (err) => {
      console.error('HTTP server error:', err);
      process.exit(1);
    })
    .listen(port, '0.0.0.0', () => {
      console.log(`\n🎓 MBA GD Simulator ready → http://localhost:${port}\n`);
    });

  // Graceful shutdown
  const shutdown = () => {
    console.log('\nShutting down gracefully...');
    gameManager.stopAllGames();
    httpServer.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
});

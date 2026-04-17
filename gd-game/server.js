import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import next from 'next';
import { GameManager } from './src/lib/gameManager.js';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const gameManager = new GameManager(process.env.ANTHROPIC_API_KEY);

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      await handle(req, res);
    } catch (err) {
      console.error(err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new SocketIOServer(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('get-rooms', (callback) => {
      callback({ rooms: gameManager.getRooms() });
    });

    socket.on('create-room', (config, callback) => {
      try {
        const room = gameManager.createRoom(config);
        io.emit('rooms-updated', { rooms: gameManager.getRooms() });
        callback({ room });
      } catch (err) {
        callback({ error: err.message });
      }
    });

    socket.on('join-room', ({ roomId, humanName }, callback) => {
      const room = gameManager.getRoom(roomId);
      if (!room) {
        callback({ error: 'Room not found' });
        return;
      }
      socket.join(roomId);
      if (humanName) gameManager.setHumanName(roomId, humanName);
      callback({ room });
    });

    socket.on('start-game', ({ roomId }) => {
      const room = gameManager.getRoom(roomId);
      if (!room) return;

      gameManager.startGame(roomId, (event, data) => {
        io.to(roomId).emit(event, data);
      });
    });

    socket.on('human-speech', ({ roomId, text }) => {
      if (!text || !text.trim()) return;
      const message = gameManager.addHumanSpeech(roomId, text.trim());
      if (message) {
        io.to(roomId).emit('message-added', message);
      }
    });

    socket.on('human-interrupt', ({ roomId }) => {
      gameManager.pauseForHuman(roomId);
      io.to(roomId).emit('human-speaking', {});
    });

    socket.on('human-done-speaking', ({ roomId }) => {
      gameManager.resumeAfterHuman(roomId);
      io.to(roomId).emit('human-done', {});
    });

    socket.on('human-closing-done', ({ roomId }) => {
      gameManager.humanClosingDone(roomId);
    });

    socket.on('get-reviews', ({ roomId }, callback) => {
      const room = gameManager.getRoom(roomId);
      if (!room) {
        callback({ error: 'Room not found' });
        return;
      }
      callback({ reviews: room.reviews, room: {
        id: room.id,
        topic: room.topic,
        panelType: room.panelType,
        humanName: room.humanName,
        messages: room.messages,
        candidates: room.candidates,
      }});
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, hostname, () => {
      console.log(`\n🎓 MBA GD Simulator ready on http://localhost:${port}\n`);
    });
});

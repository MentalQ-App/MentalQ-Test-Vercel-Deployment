const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const { Chats } = require('../models');
const { path } = require('../server');
require('dotenv').config();

function initializeSocketIO(server) {
  const io = socketIo(server, {
    path: '/socket.io/',
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["Authorization", "Content-Type"],
      credentials: true
    },
    serveClient: false,
    transports: ['websocket', 'polling']
  });

  io.use((socket, next) => {
    console.log('Socket connection attempt');
    console.log('Handshake auth:', socket.handshake.auth);
    
    const token = socket.handshake.auth.token;
    try {
      const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
      socket.userId = decoded.user_id;
      console.log('Socket authenticated for user:', socket.userId);
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.userId);

    socket.on('chat_message', async (data) => {
        try {
            const newMessage = await Chats.create({
                sender_id: socket.userId,
                receiver_id: data.receiverId,
                message: data.message
            });

            io.to(data.receiverId).emit('new_message', {
                ...newMessage.toJSON(),
                sender_id: socket.userId
            });
        } catch (error) {
            console.error('Error handling chat message:', error);
        }
    });

    socket.on('typing', (data) => {
      socket.to(data.receiver_id).emit('user_typing', {
        sender_id: socket.userId
      });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.userId);
    });
  });

  return io;
}

module.exports = initializeSocketIO;
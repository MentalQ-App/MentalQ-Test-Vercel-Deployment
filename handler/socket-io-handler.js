const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const { Chats } = require('../models');
require('dotenv').config();

function initializeSocketIO(server) {
  const io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST"]
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    try {
      const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
      socket.userId = decoded.user_id;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.userId);

    socket.join(socket.userId);

    socket.on('chat_message', async (data) => {
      try {
        const newMessage = await Chats.create({
          sender_id: socket.userId,
          receiver_id: data.receiver_id,
          message: data.message
        });

        io.to(data.receiver_id).emit('new_message', {
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
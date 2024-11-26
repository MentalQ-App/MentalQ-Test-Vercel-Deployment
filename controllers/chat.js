const { Chats, Users } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../models').sequelize; // Make sure to import sequelize

exports.sendMessage = async (req, res) => {
  const { receiver_id, message, attachment_url } = req.body;
  const sender_id = req.user_id;
  let t;

  try {
    t = await sequelize.transaction();

    // Validate receiver exists
    const receiver = await Users.findByPk(receiver_id, { transaction: t });
    if (!receiver) {
      await t.rollback();
      return res.status(404).json({ 
        error: true, 
        message: 'Receiver not found' 
      });
    }

    // Validate message is not empty
    if (!message && !attachment_url) {
      await t.rollback();
      return res.status(400).json({
        error: true,
        message: 'Message or attachment is required'
      });
    }

    const newMessage = await Chats.create({
      sender_id,
      receiver_id,
      message: message || '',
      attachment_url,
      is_read: false
    }, { transaction: t });

    await t.commit();

    const io = req.app.get('io');
    if (io) {
      io.to(receiver_id).emit('new_message', {
        ...newMessage.toJSON(),
        sender_id
      });
    }

    res.status(201).json({
      error: false,
      message: 'Message sent successfully',
      chat: newMessage
    });
  } catch (error) {
    if (t) await t.rollback();
    console.error('Error sending message:', error);
    res.status(400).json({ 
      error: true, 
      message: error.message 
    });
  }
};

exports.getChatsHistory = async (req, res) => {
  const { other_user_id } = req.params;
  const current_user_id = req.user_id;

  try {
    const otherUsers = await Users.findByPk(other_user_id);
    if (!otherUsers) {
      return res.status(404).json({
        error: true,
        message: 'Users not found'
      });
    }

    const messages = await Chats.findAll({
      where: {
        [Op.or]: [
          { 
            sender_id: current_user_id, 
            receiver_id: other_user_id 
          },
          { 
            sender_id: other_user_id, 
            receiver_id: current_user_id 
          }
        ]
      },
      order: [['created_at', 'ASC']],
      include: [
        { 
          model: Users, 
          as: 'Sender', 
          attributes: ['user_id', 'name', 'profile_photo_url'] 
        },
        { 
          model: Users, 
          as: 'Receiver', 
          attributes: ['user_id', 'name', 'profile_photo_url'] 
        }
      ],
      limit: 100
    });

    await Chats.update(
      { is_read: true },
      { 
        where: { 
          sender_id: other_user_id, 
          receiver_id: current_user_id,
          is_read: false 
        } 
      }
    );

    res.status(200).json({
      error: false,
      messages: messages
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(400).json({ 
      error: true, 
      message: error.message 
    });
  }
};

exports.getRecentChats = async (req, res) => {
  const current_user_id = req.user_id;

  try {
    const recentChats = await Chats.findAll({
      attributes: [
        [sequelize.fn('MAX', sequelize.col('created_at')), 'last_message_time'],
        [sequelize.fn('MAX', sequelize.col('chat_id')), 'last_message_id'],
        'sender_id',
        'receiver_id'
      ],
      where: {
        [Op.or]: [
          { sender_id: current_user_id },
          { receiver_id: current_user_id }
        ]
      },
      include: [
        {
          model: Users,
          as: 'Sender',
          attributes: ['user_id', 'name', 'profile_photo_url']
        },
        {
          model: Users,
          as: 'Receiver',
          attributes: ['user_id', 'name', 'profile_photo_url']
        }
      ],
      group: ['sender_id', 'receiver_id', 
        'Sender.user_id', 'Sender.name', 'Sender.profile_photo_url',
        'Receiver.user_id', 'Receiver.name', 'Receiver.profile_photo_url'
      ],
      order: [[sequelize.col('last_message_time'), 'DESC']],
      raw: true
    });

    res.status(200).json({
      error: false,
      recent_chats: recentChats
    });
  } catch (error) {
    console.error('Error fetching recent chats:', error);
    res.status(400).json({
      error: true,
      message: error.message
    });
  }
};
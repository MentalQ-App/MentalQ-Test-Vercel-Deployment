// routes/routes.js
const express = require('express');
const userController = require('../controllers/user');
const noteController = require('../controllers/note');
const authController = require('../controllers/auth');
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();

// Update profile
router.put('/users', authenticateToken,userController.updateUser);

// Auth Routes
router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.post('/request-reset', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);

// Note Routes
router.get('/notes', authenticateToken, noteController.getAllNotes);
router.get('/notes/:id', authenticateToken,noteController.getNoteById);
router.post('/notes', authenticateToken, noteController.createNote);
router.put('/notes/:id', authenticateToken, noteController.updateNote);
router.put('/notes/delete/:id', authenticateToken, noteController.deleteNote);

module.exports = router;
// routes/routes.js
const express = require('express');
const userController = require('../controllers/user');
const noteController = require('../controllers/note');
const authController = require('../controllers/auth');
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();


// CRUD operations for Users
// router.post('/users', userController.createUser);       // Create
// router.get('/users', userController.getAllUsers);       // Read all
// router.get('/users', userController.getUserById);  // Read specific
// router.delete('/users/:id', userController.deleteUser); // Delete

// Update profile
router.put('/users', authenticateToken,userController.updateUser);

// Auth Routes
router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);

// Note Routes
router.get('/notes', authenticateToken, noteController.getAllNotes);
router.get('/notes/:id', authenticateToken,noteController.getNoteById);
router.post('/notes', authenticateToken, noteController.createNote);
router.put('/notes/:id', authenticateToken, noteController.updateNote);
router.put('/notes/delete/:id', authenticateToken, noteController.deleteNote);

module.exports = router;
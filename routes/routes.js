// routes/routes.js
const express = require('express');
const userController = require('../controllers/user');
const noteController = require('../controllers/note');
const authController = require('../controllers/auth');
const analysisController = require('../controllers/analysis');
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();

// Update profile
router.put('/users/update', authenticateToken, userController.uploadProfileImage, (req, res, next) => {
    console.log(req.file);
    console.log(req.body);
    next();
}, userController.updateUser);

// Auth Routes
router.post('/register', authController.registerUser);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/login', authController.loginUser);

// Password Reset Routes
router.post('/request-reset', authController.requestPasswordReset);
router.post('/verify-otp', authController.verifyOTP);
router.post('/reset-password', authController.resetPassword);

// Note Routes
router.get('/notes', authenticateToken, noteController.getAllNotes);
router.get('/notes/:id', authenticateToken,noteController.getNoteById);
router.post('/notes', authenticateToken, noteController.createNote);
router.put('/notes/:id', authenticateToken, noteController.updateNote);
router.put('/notes/delete/:id', authenticateToken, noteController.deleteNote);

// Analysis Routes
router.get('/analysis', authenticateToken, analysisController.getAnalysis);

module.exports = router;
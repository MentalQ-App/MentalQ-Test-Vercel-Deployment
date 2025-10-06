// routes/routes.js
const express = require("express");
const userController = require("../controllers/user");
const noteController = require("../controllers/note");
const authController = require("../controllers/auth");
const analysisController = require("../controllers/analysis");
const midtransController = require("../controllers/midtrans");
const authenticateToken = require("../middleware/authenticateToken");

const router = express.Router();

// Update profile
router.put(
   "/users/update",
   authenticateToken,
   userController.uploadProfileImage,
   (req, res, next) => {
      console.log(req.file);
      console.log(req.body);
      next();
   },
   userController.updateUser
);

router.get("/terms-of-service", userController.TermsOfService);
router.get("/privacy-policy", userController.PrivacyPolicy);

// Auth Routes
router.post("/register", authController.registerUser);
router.get("/verify-email/:token", authController.verifyEmail);
router.post("/login", authController.loginUser);
router.post("/google-login", authController.authFirebase);

// User Routes
router.get("/user/:id", userController.getUserById);

// Password Reset Routes
router.post("/request-reset", authController.requestPasswordReset);
router.post("/verify-otp", authController.verifyOTP);
router.post("/reset-password", authController.resetPassword);

// Note Routes
router.get("/notes", authenticateToken, noteController.getAllNotes);
router.get("/notes/:id", authenticateToken, noteController.getNoteById);
router.post("/notes", authenticateToken, noteController.createNote);
router.put("/notes/:id", authenticateToken, noteController.updateNote);
router.put("/notes/delete/:id", authenticateToken, noteController.deleteNote);

// Auth Psikologi Routes
router.post("/register-psikologi", authController.registerPsikologi);
router.get("/psychologist", userController.getAllPsychologists);

// Psikologi Notes
router.get("/psychologist/:id", userController.getPsychologistById);

// Analysis Routes
router.get("/analysis", authenticateToken, analysisController.getAnalysis);

// Midtrans Routes
router.post("/transaction", midtransController.createTransaction);
router.get("/transaction/:id", midtransController.getStatusTransaction);
router.post("/transaction/:id/cancel", midtransController.cancelTransaction);

module.exports = router;

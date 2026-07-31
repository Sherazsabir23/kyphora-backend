const express = require("express");
const { register, verifyEmail,resendVerificationCode,resetPassword,forgotPassword, login, getMe , logout } = require("../controllers/auth.controller.js");
const { jwtAuthMiddleware } = require("../middleware/jwt.middleware.js")
const router = express.Router();


// Register User
router.post("/auth/register", register);
router.post("/auth/verify-email", verifyEmail);
router.post("/auth/login", login)
router.get(
    "/auth/me",
    jwtAuthMiddleware,
    getMe
);
router.post("/auth/resend-verification", resendVerificationCode);
router.post("/auth/logout", logout);
router.post("/auth/forgot-password", forgotPassword);
router.post("/auth/reset-password/:token", resetPassword);
module.exports = router;
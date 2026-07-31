const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

// ==============================
// Generate JWT Token
// ==============================
const generateToken = (userData, rememberMe = false) => {
  return jwt.sign(userData, process.env.JWT_SECRET, {
    expiresIn: rememberMe ? "30d" : "1d",
  });
};

// ==============================
// Verify JWT Middleware
// ==============================
const jwtAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found.",
      });
    }

    // Logout from all devices support
    if (decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please login again.",
      });
    }

    req.user = decoded;

    next();
  } catch (error) {
    console.log("JWT Error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

module.exports = {
  generateToken,
  jwtAuthMiddleware,
};
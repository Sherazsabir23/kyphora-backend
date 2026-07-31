
require("dotenv").config();
const User = require("../models/user.model.js");
const generateOTP = require("../utils/generateOTP");
const hashOTP = require("../utils/hashOTP");
const sendEmail = require("../utils/sendEmail");
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { jwtAuthMiddleware ,generateToken} = require("../middleware/jwt.middleware");
// Register User
const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      acceptedTerms,
    } = req.body;

    // Check required fields
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Check terms acceptance
    if (!acceptedTerms) {
      return res.status(400).json({
        success: false,
        message: "Please accept Terms and Privacy Policy",
      });
    }

    // Check passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

       if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }
    // Check existing user
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // Already verified
      if (existingUser.isEmailVerified) {
        return res.status(400).json({
          success: false,
          message: "User already exists. Please login.",
        });
      }

      // User exists but email not verified
      const otp = generateOTP();
      const hashedOTP = await hashOTP(otp);

      existingUser.emailVerificationCode = hashedOTP;
      existingUser.emailVerificationExpires =
        Date.now() + 10 * 60 * 1000;

      await existingUser.save();

      await sendEmail(
        email,
        "Verify your SecureVault account",
        `
          <h2>Email Verification</h2>

          <p>Your verification code is:</p>

          <h1>${otp}</h1>

          <p>This code will expire in 10 minutes.</p>
        `
      );

      return res.status(200).json({
        success: true,
        message:
          "Your account already exists but is not verified. A new verification code has been sent.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate OTP
    const otp = generateOTP();
    const hashedOTP = await hashOTP(otp);

    // Create new user
    await User.create({
      name,
      email,
      password: hashedPassword,
      acceptedTerms,
      emailVerificationCode: hashedOTP,
      emailVerificationExpires: Date.now() + 10 * 60 * 1000,
    });

    // Send verification email
await sendEmail(
  email,
  "Verify your Kyphora account",
  `
  <h2>Email Verification</h2>

  <p>Hello <b>${name}</b>,</p>

  <p>Welcome to <b>Kyphora</b>! Please use the verification code below to activate your account.</p>

  <h1 style="letter-spacing:5px;color:#3B82F6;">
    ${otp}
  </h1>

  <p>This code will expire in <b>10 minutes</b>.</p>

  <p>If you didn't create a Kyphora account, you can safely ignore this email.</p>

  <br/>

  <p>Team Kyphora ❤️</p>
  `
);

    return res.status(201).json({
      success: true,
      message: "Account created successfully. Please verify your email.",
    });

  } catch (error) {
    console.log("Register Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    if (
      !user.emailVerificationCode ||
      !user.emailVerificationExpires
    ) {
      return res.status(400).json({
        success: false,
        message: "Verification code not found",
      });
    }

    if (Date.now() > user.emailVerificationExpires) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired",
      });
    }

    const isOTPValid = await bcrypt.compare(
      otp,
      user.emailVerificationCode
    );

    if (!isOTPValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationCode = null;
    user.emailVerificationExpires = null;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });

  } catch (error) {
    console.log("Verify Email Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const login = async (req, res) => {
  try {
    const {
      email,
      password,
      rememberMe,
    } = req.body;

    // Required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    // Email verification
 if (!user.isEmailVerified) {

  const otp = generateOTP();

  const hashedOTP = await hashOTP(otp);

  user.emailVerificationCode = hashedOTP;
  user.emailVerificationExpires =
    Date.now() + 10 * 60 * 1000;

  await user.save();


  await sendEmail(
    user.email,
    "Verify your Kyphora account",
    `
    <h2>Email Verification</h2>

    <p>Hello <b>${user.name}</b>,</p>

    <p>You tried to login but your email is not verified yet.</p>

    <p>Your new verification code is:</p>

    <h1 style="letter-spacing:5px;color:#3B82F6;">
      ${otp}
    </h1>

    <p>This code will expire in <b>10 minutes</b>.</p>

    <p>If you didn't request this, you can safely ignore this email.</p>

    <br/>

    <p>Team Kyphora ❤️</p>
    `
  );


  return res.status(401).json({
    success: false,
    verifyRequired: true,
    email: user.email,
    message: "Please verify your email. A new verification code has been sent.",
  });
}

    // Compare password
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // JWT Payload
    const payload = {
      id: user._id,
      email: user.email,
      tokenVersion: user.tokenVersion,
    };

    // Generate Token
    const token = generateToken(
      payload,
      rememberMe
    );

    // Cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite:
        process.env.NODE_ENV === "production"
          ? "none"
          : "lax",

      maxAge: rememberMe
        ? 30 * 24 * 60 * 60 * 1000
        : 24 * 60 * 60 * 1000,
    });

    // Remove sensitive fields
    const userData = user.toObject();

    delete userData.password;
    delete userData.emailVerificationCode;
    delete userData.emailVerificationExpires;
    delete userData.tokenVersion;

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: userData,
    });

  } catch (error) {
    console.log("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userData = user.toObject();

    delete userData.password;
    delete userData.emailVerificationCode;
    delete userData.emailVerificationExpires;
    delete userData.tokenVersion;

    return res.status(200).json({
      success: true,
      user: userData,
    });

  } catch (error) {
    console.log("Get Me Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Logout failed",
      error: error.message,
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });

    // Same response for security
    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, a password reset link has been sent.",
      });
    }

    // Generate random token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash token before saving
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    const html = `
      <div style="font-family:Arial,sans-serif">
        <h2>Reset Your Password</h2>

        <p>Hello <b>${user.name}</b>,</p>

        <p>Click the button below to reset your password.</p>

        <a
          href="${resetUrl}"
          style="
            display:inline-block;
            background:#3B82F6;
            color:#fff;
            padding:12px 24px;
            border-radius:8px;
            text-decoration:none;
          "
        >
          Reset Password
        </a>

        <p style="margin-top:20px;">
          This link will expire in <b>15 minutes</b>.
        </p>

        <p>If you didn't request this, you can safely ignore this email.</p>
      </div>
    `;

    await sendEmail(
      user.email,
      "Reset Your Kyphora Password",
      html
    );

    return res.status(200).json({
      success: true,
      message: "Password reset link sent successfully.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }

    // Hash token from URL
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset link.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};

const resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified.",
      });
    }

    // Generate OTP
    const otp = generateOTP();

    // Hash OTP
    const hashedOTP = await hashOTP(otp);

    // Save hashed OTP
    user.emailVerificationCode = hashedOTP;
    user.emailVerificationExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    // Send original OTP via email
    await sendEmail(
      user.email,
      "Verify your Kyphora account",
      `
      <h2>Email Verification</h2>

      <p>Hello <b>${user.name}</b>,</p>

      <p>Your new verification code is:</p>

      <h1 style="letter-spacing:5px;color:#3B82F6;">
        ${otp}
      </h1>

      <p>This code will expire in <b>10 minutes</b>.</p>

      <p>If you didn't request this, you can safely ignore this email.</p>

      <br/>

      <p>Team Kyphora ❤️</p>
      `
    );

    return res.status(200).json({
      success: true,
      message: "A new verification code has been sent to your email.",
    });
  } catch (error) {
    console.error("Resend Verification Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
module.exports = {
    register,
    verifyEmail,
    login,
    getMe,
    logout,
    forgotPassword,
    resetPassword,
    resendVerificationCode,
}
const bcrypt = require("bcryptjs");
const User = require("../models/user.model.js");
const Password = require("../models/Password");
const Card = require("../models/Card");
const Note = require("../models/Note");
const Document = require("../models/document.model.js");
const ApiKey = require("../models/ApiKey");
const { generate2FASecret, verify2FAToken } = require("../utils/twoFactor");
const getDeviceInfo = require("../utils/deviceInfo");
const logActivity = require("../utils/logActivity");

// =========================
// Update Profile (name/email)
// =========================
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (email && email.toLowerCase() !== user.email) {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(400).json({ success: false, message: "Email already in use." });
      }
      user.email = email.toLowerCase();
    }

    if (name !== undefined) user.name = name;

    await user.save();

    const userData = user.toObject();
    delete userData.password;
    delete userData.emailVerificationCode;
    delete userData.emailVerificationExpires;
    delete userData.tokenVersion;

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: userData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to update profile." });
  }
};

// =========================
// Update Avatar (expects an already-hosted URL, e.g. from your upload flow)
// =========================
exports.updateAvatar = async (req, res) => {
  try {
    const { avatar } = req.body;

    if (!avatar) {
      return res.status(400).json({ success: false, message: "Avatar URL is required." });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Avatar updated successfully.",
      avatar: user.avatar,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to update avatar." });
  }
};

// =========================
// Update Master Password
// =========================
exports.updateMasterPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ success: false, message: "New passwords do not match." });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters.",
      });
    }

    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const isCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isCorrect) {
      return res.status(401).json({ success: false, message: "Current password is incorrect." });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    // Invalidate any existing sessions/tokens on other devices
    user.tokenVersion += 1;
    await user.save();

    const { device, location, ip } = getDeviceInfo(req);
    await logActivity({
      userId: user._id,
      type: "Security Events",
      title: "Master password changed",
      device,
      location,
      ip,
    });

    return res.status(200).json({
      success: true,
      message: "Master password updated successfully. Please log in again.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to update password." });
  }
};

// =========================
// 2FA: Start setup — returns QR code to scan
// =========================
exports.setup2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({ success: false, message: "2FA is already enabled." });
    }

    const { secret, qrCodeDataUrl } = await generate2FASecret(user.email);

    // Store as "temp" until the user proves they scanned it correctly
    user.twoFactorTempSecret = secret;
    await user.save();

    return res.status(200).json({
      success: true,
      qrCode: qrCodeDataUrl,
      // Included so the user can type it manually if they can't scan
      manualEntryKey: secret,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to start 2FA setup." });
  }
};

// =========================
// 2FA: Confirm setup with a code from the authenticator app
// =========================
exports.verify2FASetup = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: "Verification code is required." });
    }

    const user = await User.findById(req.user.id).select("+twoFactorTempSecret");
    if (!user || !user.twoFactorTempSecret) {
      return res.status(400).json({
        success: false,
        message: "No 2FA setup in progress. Please restart setup.",
      });
    }

    const isValid = verify2FAToken(token, user.twoFactorTempSecret);
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Invalid verification code." });
    }

    user.twoFactorSecret = user.twoFactorTempSecret;
    user.twoFactorTempSecret = null;
    user.twoFactorEnabled = true;
    await user.save();

    const { device, location, ip } = getDeviceInfo(req);
    await logActivity({
      userId: user._id,
      type: "Security Events",
      title: "Two-factor authentication enabled",
      device,
      location,
      ip,
    });

    return res.status(200).json({ success: true, message: "2FA enabled successfully." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to verify 2FA code." });
  }
};

// =========================
// 2FA: Disable (requires current password)
// =========================
exports.disable2FA = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required." });
    }

    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const isCorrect = await bcrypt.compare(password, user.password);
    if (!isCorrect) {
      return res.status(401).json({ success: false, message: "Incorrect password." });
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.twoFactorTempSecret = null;
    await user.save();

    const { device, location, ip } = getDeviceInfo(req);
    await logActivity({
      userId: user._id,
      type: "Security Events",
      title: "Two-factor authentication disabled",
      device,
      location,
      ip,
    });

    return res.status(200).json({ success: true, message: "2FA disabled successfully." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to disable 2FA." });
  }
};

// =========================
// Log Out All Devices (bumps tokenVersion, invalidating every existing token)
// =========================
exports.logoutAllDevices = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    user.tokenVersion += 1;
    await user.save();

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out from all devices.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to log out all devices." });
  }
};

// =========================
// Delete Account (cascades vault data)
// =========================
exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required to delete your account." });
    }

    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const isCorrect = await bcrypt.compare(password, user.password);
    if (!isCorrect) {
      return res.status(401).json({ success: false, message: "Incorrect password." });
    }

    const userId = user._id;

    await Promise.all([
      Password.deleteMany({ user: userId }),
      Card.deleteMany({ user: userId }),
      Note.deleteMany({ user: userId }),
      Document.deleteMany({ user: userId }),
      ApiKey.deleteMany({ user: userId }),
    ]);

    await user.deleteOne();

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Account and all associated data deleted successfully.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to delete account." });
  }
};
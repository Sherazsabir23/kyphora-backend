const ActivityLog = require("../models/ActivityLog");

/**
 * Writes one activity log entry. Never throws — a logging failure
 * should never break the actual action (login, password save, etc.)
 * that triggered it.
 */
const logActivity = async ({ userId, type, title, device, location, ip }) => {
  try {
    await ActivityLog.create({ user: userId, type, title, device, location, ip });
  } catch (err) {
    console.error("logActivity error:", err);
  }
};

module.exports = logActivity;
const Password = require("../models/Password");
const Card = require("../models/Card");
const Note = require("../models/Note");
const ApiKey = require("../models/ApiKey");
const Document = require("../models/document.model.js"); // verify this filename matches your project
const ActivityLog = require("../models/ActivityLog");
const User = require("../models/user.model.js");

// =========================
// Get Dashboard Overview
// =========================
exports.getDashboardOverview = async (req, res) => {
  try {
    const userId = req.user.id;

    const [passwords, cards, notes, apiKeys, documents, user] = await Promise.all([
      Password.find({ user: userId }).select(
        "title username category passwordStrength passwordHash createdAt updatedAt"
      ),
      Card.find({ user: userId }).select("cardName cardHolderName createdAt updatedAt"),
      Note.find({ user: userId }).select("title createdAt updatedAt"),
      ApiKey.find({ user: userId }).select("service createdAt updatedAt"),
      Document.countDocuments({ user: userId }),
      User.findById(userId).select("tokenVersionUpdatedAt"),
    ]);

    // ---------- Password health (same logic as Security Center) ----------
    const totalPasswords = passwords.length;
    const strong = passwords.filter((p) => p.passwordStrength === "Strong").length;
    const weak = passwords.filter((p) => p.passwordStrength === "Weak").length;

    const hashCounts = {};
    passwords.forEach((p) => {
      if (!p.passwordHash) return;
      hashCounts[p.passwordHash] = (hashCounts[p.passwordHash] || 0) + 1;
    });
    const reused = passwords.filter(
      (p) => p.passwordHash && hashCounts[p.passwordHash] > 1
    ).length;

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
    const old = passwords.filter((p) => p.createdAt < twelveMonthsAgo).length;

    let securityScore = 100;
    if (totalPasswords > 0) {
      securityScore -= (weak / totalPasswords) * 40;
      securityScore -= (reused / totalPasswords) * 30;
      securityScore -= (old / totalPasswords) * 15;
    }
    if (!user?.twoFactorEnabled) securityScore -= 10;
    securityScore = Math.max(0, Math.round(securityScore));

    // ---------- Total vault items across all types ----------
    const totalVaultItems =
      passwords.length + cards.length + notes.length + apiKeys.length + documents;

    // ---------- Recent vault items (merged, for VaultTable) ----------
    const recentVaultItems = [
      ...passwords.map((p) => ({
        id: p._id,
        name: p.title,
        username: p.username,
        category: "Login",
        updated: p.updatedAt,
      })),
      ...notes.map((n) => ({
        id: n._id,
        name: n.title,
        username: "—",
        category: "Note",
        updated: n.updatedAt,
      })),
      ...cards.map((c) => ({
        id: c._id,
        name: c.cardName,
        username: c.cardHolderName,
        category: "Card",
        updated: c.updatedAt,
      })),
      ...apiKeys.map((k) => ({
        id: k._id,
        name: k.service,
        username: "••••••••",
        category: "API Key",
        updated: k.updatedAt,
      })),
    ]
      .sort((a, b) => new Date(b.updated) - new Date(a.updated))
      .slice(0, 10);

    // ---------- Active devices (same "still valid" logic as Settings) ----------
    const loginQuery = { user: userId, type: "Login" };
    if (user?.tokenVersionUpdatedAt) {
      loginQuery.createdAt = { $gte: user.tokenVersionUpdatedAt };
    }
    const activeLogins = await ActivityLog.find(loginQuery).select("device");
    const activeDevicesCount = new Set(activeLogins.map((l) => l.device)).size;

    // ---------- Recent activity (raw — frontend formats icon/time) ----------
    const recentActivityRaw = await ActivityLog.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("type title device location createdAt");

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalVaultItems,
          securityScore,
          weakPasswordsCount: weak,
          activeDevicesCount,
        },
        twoFactorEnabled: !!user?.twoFactorEnabled,
        passwordHealth: {
          strong,
          weak,
          reused,
          old,
          total: totalPasswords,
        },
        recentVaultItems,
        recentActivity: recentActivityRaw,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard overview.",
    });
  }
};
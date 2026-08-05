const Password = require("../models/Password");

// =========================
// Get Security Overview
// =========================
exports.getSecurityOverview = async (req, res) => {
  try {
    const passwords = await Password.find({ user: req.user.id }).select(
      "passwordStrength passwordHash createdAt"
    );

    const total = passwords.length;

    const strong = passwords.filter((p) => p.passwordStrength === "Strong").length;
    const weak = passwords.filter((p) => p.passwordStrength === "Weak").length;
    const medium = passwords.filter((p) => p.passwordStrength === "Medium").length;

    // Reused: hash appears more than once. Entries saved before passwordHash
    // existed will have no hash (undefined) — those are excluded, not
    // counted as duplicates of each other.
    const hashCounts = {};
    passwords.forEach((p) => {
      if (!p.passwordHash) return;
      hashCounts[p.passwordHash] = (hashCounts[p.passwordHash] || 0) + 1;
    });
    const reused = passwords.filter(
      (p) => p.passwordHash && hashCounts[p.passwordHash] > 1
    ).length;

    // Old: created more than 12 months ago
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
    const old = passwords.filter((p) => p.createdAt < twelveMonthsAgo).length;

    // 2FA not implemented yet — static false for now
    const twoFactorEnabled = false;

    // Security score: 100, minus weighted penalties for weak/reused/old %,
    // minus a flat 10 for no 2FA. Tune the weights whenever you like.
    let score = 100;
    if (total > 0) {
      score -= (weak / total) * 40;
      score -= (reused / total) * 30;
      score -= (old / total) * 15;
    }
    if (!twoFactorEnabled) score -= 10;
    score = Math.max(0, Math.round(score));

    return res.status(200).json({
      success: true,
      data: {
        securityScore: score,
        passwordHealth: {
          strong,
          weak,
          medium,
          reused,
          old,
          total,
        },
        recommendations: {
          weakPasswordsCount: weak,
          twoFactorEnabled,
          oldPasswordsCount: old,
        },
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch security overview.",
    });
  }
};
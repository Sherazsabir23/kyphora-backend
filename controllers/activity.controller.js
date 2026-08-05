const ActivityLog = require("../models/ActivityLog");

// =========================
// Get Activity Logs
// =========================
exports.getActivityLogs = async (req, res) => {
  try {
    const { type } = req.query;

    const query = { user: req.user.id };

    if (type && type !== "All Activity") {
      query.type = type;
    }

    const logs = await ActivityLog.find(query).sort({ createdAt: -1 }).limit(100);

    return res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch activity logs.",
    });
  }
};
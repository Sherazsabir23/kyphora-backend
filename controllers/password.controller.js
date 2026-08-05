const Password = require("../models/Password");
const { encrypt, decrypt } = require("../utils/encryption");
const checkPasswordStrength = require("../utils/passwordStrength");
const hashPassword = require("../utils/passwordHash"); // NEW
const getDeviceInfo = require("../utils/deviceInfo"); // NEW
const logActivity = require("../utils/logActivity"); // NEW

// =========================
// Create Password
// =========================
exports.createPassword = async (req, res) => {
  try {
    const {
      title,
      website,
      username,
      password,
      category,
      notes,
      favorite,
    } = req.body;

    if (!title || !website || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "Title, website, username and password are required.",
      });
    }

    // Generate favicon
    const domain = website
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0];

    const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

    const vaultItem = await Password.create({
      user: req.user.id,
      title,
      website,
      username,
      encryptedPassword: encrypt(password),
      passwordHash: hashPassword(password), // NEW
      category,
      notes,
      favorite,
      passwordStrength: checkPasswordStrength(password),
      favicon,
    });

    const { device, location, ip } = getDeviceInfo(req);
    await logActivity({
      userId: req.user.id,
      type: "Vault Changes",
      title: `Added new password — ${title}`,
      device,
      location,
      ip,
    });

    return res.status(201).json({
      success: true,
      message: "Password saved successfully.",
      data: vaultItem,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to save password.",
    });
  }
};

// =========================
// Get All Passwords
// =========================
exports.getPasswords = async (req, res) => {
  try {
    const { search, category } = req.query;

    const query = {
      user: req.user.id,
    };

    if (search) {
      query.$or = [
        {
          title: {
            $regex: search,
            $options: "i",
          },
        },
        {
          username: {
            $regex: search,
            $options: "i",
          },
        },
        {
          website: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    if (category && category !== "All") {
      query.category = category;
    }

    const passwords = await Password.find(query).sort({
      updatedAt: -1,
    });

    const formattedPasswords = passwords.map((item) => ({
      _id: item._id,
      title: item.title,
      website: item.website,
      username: item.username,
      favicon: item.favicon,
      category: item.category,
      notes: item.notes,
      favorite: item.favorite,
      passwordStrength: item.passwordStrength,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      count: formattedPasswords.length,
      data: formattedPasswords,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch passwords.",
    });
  }
};

// =========================
// Get Single Password
// =========================
exports.getPassword = async (req, res) => {
  try {
    const password = await Password.findById(req.params.id);

    if (!password) {
      return res.status(404).json({
        success: false,
        message: "Password not found.",
      });
    }

    if (password.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...password.toObject(),
        password: decrypt(password.encryptedPassword),
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch password.",
    });
  }
};

// =========================
// Update Password
// =========================
exports.updatePassword = async (req, res) => {
  try {
    const passwordDoc = await Password.findById(req.params.id);

    if (!passwordDoc) {
      return res.status(404).json({
        success: false,
        message: "Password not found.",
      });
    }

    if (passwordDoc.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access.",
      });
    }

    const {
      title,
      website,
      username,
      password,
      category,
      notes,
      favorite,
    } = req.body;

    if (title !== undefined) passwordDoc.title = title;

    // Update website + favicon
    if (website !== undefined) {
      passwordDoc.website = website;

      const domain = website
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .split("/")[0];

      passwordDoc.favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    }

    if (username !== undefined) passwordDoc.username = username;
    if (category !== undefined) passwordDoc.category = category;
    if (notes !== undefined) passwordDoc.notes = notes;
    if (favorite !== undefined) passwordDoc.favorite = favorite;

    if (password) {
      passwordDoc.encryptedPassword = encrypt(password);
      passwordDoc.passwordHash = hashPassword(password); // NEW
      passwordDoc.passwordStrength = checkPasswordStrength(password);
    }

    await passwordDoc.save();

    const { device, location, ip } = getDeviceInfo(req);
    await logActivity({
      userId: req.user.id,
      type: "Vault Changes",
      title: `Updated vault item — ${passwordDoc.title}`,
      device,
      location,
      ip,
    });

    return res.status(200).json({
      success: true,
      message: "Password updated successfully.",
      data: passwordDoc,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update password.",
    });
  }
};
// =========================
// Delete Password
// =========================
exports.deletePassword = async (req, res) => {
  try {
    const password = await Password.findById(req.params.id);

    if (!password) {
      return res.status(404).json({
        success: false,
        message: "Password not found.",
      });
    }

    if (password.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access.",
      });
    }

    await password.deleteOne();

    const { device, location, ip } = getDeviceInfo(req);
    await logActivity({
      userId: req.user.id,
      type: "Vault Changes",
      title: `Deleted vault item — ${password.title}`,
      device,
      location,
      ip,
    });

    return res.status(200).json({
      success: true,
      message: "Password deleted successfully.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete password.",
    });
  }
};
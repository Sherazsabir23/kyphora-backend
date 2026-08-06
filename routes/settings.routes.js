const express = require("express");

const router = express.Router();
const upload = require("../utils/upload");
const { jwtAuthMiddleware } = require("../middleware/jwt.middleware.js");

const {
  updateProfile,
  updateAvatar,
  updateMasterPassword,
  setup2FA,
  verify2FASetup,
  disable2FA,
  logoutAllDevices,
  deleteAccount,
} = require("../controllers/settings.controller");

router.use(jwtAuthMiddleware);

router.put("/profile", updateProfile);
router.put("/avatar", upload.single("avatar"), updateAvatar);
router.put("/password", updateMasterPassword);

router.post("/2fa/setup", setup2FA);
router.post("/2fa/verify", verify2FASetup);
router.post("/2fa/disable", disable2FA);

router.post("/logout-all", logoutAllDevices);

router.delete("/account", deleteAccount);

module.exports = router;
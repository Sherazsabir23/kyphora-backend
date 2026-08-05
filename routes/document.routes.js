const express = require("express");
const router = express.Router();

const upload = require("../utils/upload");

const {
  uploadDocument,
  getDocuments,
  updateDocument,
  deleteDocument,
  downloadDocument,
  previewDocument
} = require("../controllers/document.controller");

const {
  jwtAuthMiddleware,
} = require("../middleware/jwt.middleware");

router.get("/", jwtAuthMiddleware, getDocuments);

router.post(
  "/",
  jwtAuthMiddleware,
  upload.single("document"),
  uploadDocument
);

router.put(
  "/:id",
  jwtAuthMiddleware,
  upload.single("document"),
  updateDocument
);

router.delete(
  "/:id",
  jwtAuthMiddleware,
  deleteDocument
);

router.get(
  "/download/:id",
  jwtAuthMiddleware,
  downloadDocument
);
router.get(
  "/:id/preview",
  jwtAuthMiddleware,
  previewDocument
);

module.exports = router;
const fs = require("fs");
const path = require("path");

const Document = require("../models/document.model");
const {
  encryptFile,
  decryptFile,
} = require("../utils/encryption");
const {
  uploadToCloud,
  downloadFromCloud,
  deleteFromCloud,
  removeLocal,
} = require("../utils/cloudStorage");


// ======================================
// Helper: file type
// ======================================

const getFileType = (mimetype) => {
  if (mimetype === "application/pdf") return "PDF";
  if (mimetype.startsWith("image/")) return "Image";
  if (
    mimetype.includes("sheet") ||
    mimetype.includes("excel") ||
    mimetype.includes("spreadsheet")
  ) {
    return "Spreadsheet";
  }
  return "File";
};


// ======================================
// Upload Document
// ======================================

exports.uploadDocument = async (req, res) => {
  let encryptedPath;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a document.",
      });
    }

    // Encrypt uploaded file
    encryptedPath = await encryptFile(req.file.path);

    // Upload encrypted file to Cloudinary
    const cloudUrl = await uploadToCloud(encryptedPath);

    const type = getFileType(req.file.mimetype);

    const document = await Document.create({
      user: req.user.id,

      name: req.file.originalname,

      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      filePath: cloudUrl,

      type,

      size: `${(req.file.size / 1024 / 1024).toFixed(2)} MB`,
    });

    removeLocal(req.file.path, encryptedPath);

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully.",
      data: document,
    });
  } catch (error) {
    console.error(error);

    if (req.file) removeLocal(req.file.path, encryptedPath);

    res.status(500).json({
      success: false,
      message: "Failed to upload document.",
    });
  }
};


// ======================================
// Get All Documents
// ======================================

exports.getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({
      user: req.user.id,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: documents,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch documents.",
    });
  }
};


// ======================================
// Get Single Document
// ======================================

exports.getDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch document.",
    });
  }
};


// ======================================
// Download Document
// ======================================

exports.downloadDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found.",
      });
    }

    const encTemp = path.join("uploads", `enc-${Date.now()}.enc`);
    const tempPath = path.join(
      "uploads",
      `temp-${Date.now()}-${document.name}`
    );

    try {
      // Cloudinary se encrypted file utaro, phir decrypt karo
      await downloadFromCloud(document.filePath, encTemp);
      await decryptFile(encTemp, tempPath);
    } catch (err) {
      removeLocal(encTemp, tempPath);
      throw err;
    }

    res.download(tempPath, document.name, () => {
      removeLocal(tempPath, encTemp);
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to download document.",
    });
  }
};


// ======================================
// Update Document
// ======================================

exports.updateDocument = async (req, res) => {
  let encryptedPath;

  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!document) {
      if (req.file) removeLocal(req.file.path);

      return res.status(404).json({
        success: false,
        message: "Document not found.",
      });
    }

    if (req.file) {
      const oldUrl = document.filePath;

      // Encrypt new uploaded file
      encryptedPath = await encryptFile(req.file.path);

      // Upload new encrypted file to Cloudinary
      const cloudUrl = await uploadToCloud(encryptedPath);

      removeLocal(req.file.path, encryptedPath);

      document.name = req.file.originalname;
      document.originalName = req.file.originalname;
      document.mimetype = req.file.mimetype;
      document.filePath = cloudUrl;
      document.type = getFileType(req.file.mimetype);
      document.size = `${(req.file.size / 1024 / 1024).toFixed(2)} MB`;

      await document.save();

      // Purani file Cloudinary se delete (save ke baad, taake fail hone par data na jaye)
      await deleteFromCloud(oldUrl);
    } else {
      await document.save();
    }

    res.status(200).json({
      success: true,
      message: "Document updated successfully.",
      data: document,
    });
  } catch (error) {
    console.error(error);

    if (req.file) removeLocal(req.file.path, encryptedPath);

    res.status(500).json({
      success: false,
      message: "Failed to update document.",
    });
  }
};


// ======================================
// Delete Document
// ======================================

exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found.",
      });
    }

    await deleteFromCloud(document.filePath);

    await document.deleteOne();

    res.status(200).json({
      success: true,
      message: "Document deleted successfully.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to delete document.",
    });
  }
};


// ======================================
// Preview Document
// ======================================

exports.previewDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found.",
      });
    }

    const encTemp = path.join("uploads", `enc-${Date.now()}.enc`);
    const tempPath = path.join(
      "uploads",
      `preview-${Date.now()}-${document.originalName}`
    );

    try {
      await downloadFromCloud(document.filePath, encTemp);
      await decryptFile(encTemp, tempPath);
    } catch (err) {
      removeLocal(encTemp, tempPath);
      throw err;
    }

    res.setHeader("Content-Disposition", "inline");

    res.sendFile(path.resolve(tempPath), () => {
      removeLocal(tempPath, encTemp);
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to preview document.",
    });
  }
};
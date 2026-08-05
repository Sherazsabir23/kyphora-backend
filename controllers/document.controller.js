const fs = require("fs");
const path = require("path");

const Document = require("../models/document.model");
const {
  encryptFile,
  decryptFile,
} = require("../utils/encryption");


// ======================================
// Upload Document
// ======================================

exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a document.",
      });
    }

    // Encrypt uploaded file
    const encryptedPath = await encryptFile(req.file.path);

   let type = "File";

if (req.file.mimetype === "application/pdf") {
  type = "PDF";
} else if (req.file.mimetype.startsWith("image/")) {
  type = "Image";
} else if (
  req.file.mimetype.includes("sheet") ||
  req.file.mimetype.includes("excel") ||
  req.file.mimetype.includes("spreadsheet")
) {
  type = "Spreadsheet";
}

const document = await Document.create({
  user: req.user.id,

  name: req.file.originalname,

  originalName: req.file.originalname,
  mimetype: req.file.mimetype, 
  filePath: encryptedPath,

  type,

  size: `${(req.file.size / 1024 / 1024).toFixed(2)} MB`,
});

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully.",
      data: document,
    });
  } catch (error) {
    console.error(error);

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

    const tempPath = path.join(
      "uploads",
      `temp-${Date.now()}-${document.name}`
    );

    await decryptFile(document.filePath, tempPath);

    res.download(tempPath, document.name, () => {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
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

    if (req.file) {

      // Delete old encrypted file

      if (fs.existsSync(document.filePath)) {
  fs.unlinkSync(document.filePath);
}

      // Encrypt new uploaded file

      const encryptedPath = await encryptFile(req.file.path);

     let type = "File";

if (req.file.mimetype === "application/pdf") {
  type = "PDF";
} else if (req.file.mimetype.startsWith("image/")) {
  type = "Image";
} else if (
  req.file.mimetype.includes("sheet") ||
  req.file.mimetype.includes("excel") ||
  req.file.mimetype.includes("spreadsheet")
) {
  type = "Spreadsheet";
}

document.name = req.file.originalname;
document.originalName = req.file.originalname;
document.filePath = encryptedPath;
document.type = type;
document.size = `${(req.file.size / 1024 / 1024).toFixed(2)} MB`;
    }

    await document.save();

    res.status(200).json({
      success: true,
      message: "Document updated successfully.",
      data: document,
    });
  } catch (error) {
    console.error(error);

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

    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

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

    const tempPath = path.join(
      "uploads",
      `preview-${Date.now()}-${document.originalName}`
    );

    await decryptFile(document.filePath, tempPath);

    res.setHeader("Content-Disposition", "inline");

    res.sendFile(path.resolve(tempPath), (err) => {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to preview document.",
    });
  }
};
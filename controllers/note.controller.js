const Note = require("../models/Note");
const { encrypt, decrypt } = require("../utils/encryption");

// =========================
// Create Note
// =========================

exports.createNote = async (req, res) => {
  try {
    const {
      title,
      content,
      category,
      favorite,
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required.",
      });
    }

    const note = await Note.create({
      user: req.user.id,
      title,
      encryptedContent: encrypt(content),
      category,
      favorite,
    });

    return res.status(201).json({
      success: true,
      message: "Note created successfully.",
      data: note,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to create note.",
    });
  }
};

// =========================
// Get All Notes
// =========================

exports.getNotes = async (req, res) => {
  try {
    const { search, category } = req.query;

    const query = {
      user: req.user.id,
    };

    if (search) {
      query.title = {
        $regex: search,
        $options: "i",
      };
    }

    if (category && category !== "All") {
      query.category = category;
    }

    const notes = await Note.find(query).sort({
      updatedAt: -1,
    });

    const formattedNotes = notes.map((note) => {
      const content = decrypt(note.encryptedContent);

      return {
        _id: note._id,
        title: note.title,
        preview:
          content.length > 120
            ? content.substring(0, 120) + "..."
            : content,
        category: note.category,
        favorite: note.favorite,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedNotes.length,
      data: formattedNotes,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch notes.",
    });
  }
};

// =========================
// Get Single Note
// =========================

exports.getNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found.",
      });
    }

    if (note.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: note._id,
        title: note.title,
        content: decrypt(note.encryptedContent),
        category: note.category,
        favorite: note.favorite,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      },
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch note.",
    });
  }
};

// =========================
// Update Note
// =========================

exports.updateNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found.",
      });
    }

    if (note.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access.",
      });
    }

    const {
      title,
      content,
      category,
      favorite,
    } = req.body;

    if (title !== undefined) note.title = title;

    if (category !== undefined)
      note.category = category;

    if (favorite !== undefined)
      note.favorite = favorite;

    if (content !== undefined) {
      note.encryptedContent = encrypt(content);
    }

    await note.save();

    return res.status(200).json({
      success: true,
      message: "Note updated successfully.",
      data: note,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update note.",
    });
  }
};

// =========================
// Delete Note
// =========================

exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found.",
      });
    }

    if (note.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access.",
      });
    }

    await note.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Note deleted successfully.",
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete note.",
    });
  }
};
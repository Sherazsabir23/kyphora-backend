const ApiKey = require("../models/ApiKey");
const { encrypt, decrypt } = require("../utils/encryption");

const getApiKeys = async (req, res) => {
    try {
        const keys = await ApiKey.find({ user: req.user.id }).sort({
            createdAt: -1,
        });

        const decryptedKeys = keys.map((item) => ({
            ...item.toObject(),
            key: decrypt(item.key),
        }));

        res.status(200).json({
            success: true,
            data: decryptedKeys,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const createApiKey = async (req, res) => {
    try {
        const { service, key } = req.body;

        const apiKey = await ApiKey.create({
            user: req.user.id,
            service,
            key: encrypt(key),
        });

        res.status(201).json({
            success: true,
            message: "API key created successfully.",
            data: {
                ...apiKey.toObject(),
                key,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
const updateApiKey = async (req, res) => {
    try {
        const { service, key } = req.body;

        const apiKey = await ApiKey.findOneAndUpdate(
            {
                _id: req.params.id,
                user: req.user.id,
            },
            {
                service,
                key: encrypt(key),
            },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!apiKey) {
            return res.status(404).json({
                success: false,
                message: "API key not found.",
            });
        }

        const response = {
            ...apiKey.toObject(),
            key: decrypt(apiKey.key),
        };

        res.status(200).json({
            success: true,
            message: "API key updated successfully.",
            data: response,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const deleteApiKey = async (req, res) => {
  try {
    const apiKey = await ApiKey.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: "API Key not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "API Key deleted successfully.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
module.exports = {
    getApiKeys,
    createApiKey,
    updateApiKey,
    deleteApiKey,
};
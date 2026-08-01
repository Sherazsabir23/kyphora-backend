const Card = require("../models/Card");
const { encrypt, decrypt } = require("../utils/encryption");

exports.createCard = async (req, res) => {
  try {
    const {
      cardName,
      cardHolderName,
      cardNumber,
      cvv,
      expiryMonth,
      expiryYear,
      bankName,
      cardType,
      notes,
      favorite,
    } = req.body;

    if (
      !cardName ||
      !cardHolderName ||
      !cardNumber ||
      !cvv ||
      !expiryMonth ||
      !expiryYear
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields.",
      });
    }

    const card = await Card.create({
      user: req.user.id,

      cardName,
      cardHolderName,

      encryptedCardNumber: encrypt(cardNumber),
      encryptedCVV: encrypt(cvv),

      expiryMonth,
      expiryYear,

      bankName,
      cardType,

      encryptedNotes: notes ? encrypt(notes) : "",

      favorite,
    });

    return res.status(201).json({
      success: true,
      message: "Card added successfully.",
      data: card,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to create card.",
    });
  }
};

exports.getCards = async (req, res) => {
  try {
    const cards = await Card.find({
      user: req.user.id,
    }).sort({
      updatedAt: -1,
    });

    const formattedCards = cards.map((card) => {
      const cardNumber = decrypt(card.encryptedCardNumber);

      const last4 = cardNumber.slice(-4);

      return {
        _id: card._id,
        cardName: card.cardName,
        cardHolderName: card.cardHolderName,
        bankName: card.bankName,
        cardType: card.cardType,
        expiryMonth: card.expiryMonth,
        expiryYear: card.expiryYear,
        expiry: `${card.expiryMonth}/${card.expiryYear}`,
        last4,
        maskedNumber: `•••• •••• •••• ${last4}`,
        favorite: card.favorite,
        createdAt: card.createdAt,
        updatedAt: card.updatedAt,
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedCards.length,
      data: formattedCards,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch cards.",
    });
  }
};

exports.getCard = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);

    if (!card) {
      return res.status(404).json({
        success: false,
        message: "Card not found.",
      });
    }

    if (card.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: card._id,

        cardName: card.cardName,
        cardHolderName: card.cardHolderName,

        cardNumber: decrypt(card.encryptedCardNumber),
        cvv: decrypt(card.encryptedCVV),

        expiryMonth: card.expiryMonth,
        expiryYear: card.expiryYear,

        bankName: card.bankName,
        cardType: card.cardType,

        notes: card.encryptedNotes
          ? decrypt(card.encryptedNotes)
          : "",

        favorite: card.favorite,

        createdAt: card.createdAt,
        updatedAt: card.updatedAt,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch card.",
    });
  }
};


exports.updateCard = async (req, res) => {
  try {
    const {
      cardName,
      cardHolderName,
      cardNumber,
      cvv,
      expiryMonth,
      expiryYear,
      bankName,
      cardType,
      notes,
      favorite,
    } = req.body;

    const card = await Card.findById(req.params.id);

    if (!card) {
      return res.status(404).json({
        success: false,
        message: "Card not found.",
      });
    }

    if (card.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access.",
      });
    }

    card.cardName = cardName ?? card.cardName;
    card.cardHolderName =
      cardHolderName ?? card.cardHolderName;

    if (cardNumber) {
      card.encryptedCardNumber = encrypt(cardNumber);
    }

    if (cvv) {
      card.encryptedCVV = encrypt(cvv);
    }

    card.expiryMonth =
      expiryMonth ?? card.expiryMonth;

    card.expiryYear =
      expiryYear ?? card.expiryYear;

    card.bankName =
      bankName ?? card.bankName;

    card.cardType =
      cardType ?? card.cardType;

    if (notes !== undefined) {
      card.encryptedNotes = notes
        ? encrypt(notes)
        : "";
    }

    if (favorite !== undefined) {
      card.favorite = favorite;
    }

    await card.save();

    return res.status(200).json({
      success: true,
      message: "Card updated successfully.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update card.",
    });
  }
};

exports.deleteCard = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);

    if (!card) {
      return res.status(404).json({
        success: false,
        message: "Card not found.",
      });
    }

    if (card.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access.",
      });
    }

    await card.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Card deleted successfully.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete card.",
    });
  }
};
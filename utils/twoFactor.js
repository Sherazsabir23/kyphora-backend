const { generateSecret, generateURI, verify } = require("otplib");
const QRCode = require("qrcode");

// otplib v13 API (complete rewrite from v12's `authenticator` object) —
// generateSecret/generateURI are sync, verify is async and returns
// { valid: boolean }, not a plain boolean.

// Generates a new base32 secret + a scannable QR code data URL for it.
const generate2FASecret = async (email) => {
  const secret = generateSecret();
  const otpauthUrl = generateURI({
    issuer: "Kyphora",
    label: email,
    secret,
  });
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

  return { secret, qrCodeDataUrl };
};

// Verifies a 6-digit code against a stored secret.
const verify2FAToken = async (token, secret) => {
  try {
    const result = await verify({ secret, token });
    return result.valid;
  } catch (err) {
    return false;
  }
};

module.exports = { generate2FASecret, verify2FAToken };
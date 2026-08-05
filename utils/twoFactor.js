const { authenticator } = require("otplib");
const QRCode = require("qrcode");

// Generates a new base32 secret + a scannable QR code data URL for it.
// The label (email) and issuer show up in the user's authenticator app.
const generate2FASecret = async (email) => {
  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(email, "Kyphora", secret);
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

  return { secret, qrCodeDataUrl };
};

// Verifies a 6-digit code against a stored secret. Allows a small
// time-drift window by default (otplib default is +/- 1 step = 30s).
const verify2FAToken = (token, secret) => {
  try {
    return authenticator.verify({ token, secret });
  } catch (err) {
    return false;
  }
};

module.exports = { generate2FASecret, verify2FAToken };
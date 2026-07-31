const crypto = require("crypto");

const ALGORITHM = "aes-256-cbc";

// 32-byte key
const SECRET_KEY = crypto
  .createHash("sha256")
  .update(process.env.VAULT_SECRET)
  .digest();

const encrypt = (text) => {
  if (!text) return "";

  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return `${iv.toString("hex")}:${encrypted}`;
};

const decrypt = (encryptedText) => {
  if (!encryptedText) return "";

  const [ivHex, encrypted] = encryptedText.split(":");

  const iv = Buffer.from(ivHex, "hex");

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    SECRET_KEY,
    iv
  );

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};

module.exports = {
  encrypt,
  decrypt,
};
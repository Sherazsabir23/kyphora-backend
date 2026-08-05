const crypto = require("crypto");

// One-way hash of the plaintext password, used only to detect reuse
// across a user's vault — never used to recover the password itself.
const hashPassword = (password) => {
  return crypto.createHash("sha256").update(password, "utf8").digest("hex");
};

module.exports = hashPassword;
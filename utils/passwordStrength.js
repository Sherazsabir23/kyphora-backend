const checkPasswordStrength = (password) => {
  if (!password || password.length < 8) {
    return "Weak";
  }

  let score = 0;

  // Length
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  // Lowercase
  if (/[a-z]/.test(password)) score++;

  // Uppercase
  if (/[A-Z]/.test(password)) score++;

  // Number
  if (/\d/.test(password)) score++;

  // Special Character
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 3) return "Weak";
  if (score <= 5) return "Medium";

  return "Strong";
};

module.exports = checkPasswordStrength;
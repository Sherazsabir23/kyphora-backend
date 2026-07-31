const bcrypt = require("bcryptjs");

const hashOTP = async (otp) => {
  return await bcrypt.hash(otp, 10);
};

module.exports = hashOTP;
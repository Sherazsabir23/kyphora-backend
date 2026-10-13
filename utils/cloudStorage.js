const fs = require("fs");
const { Readable } = require("stream");
const { pipeline } = require("stream/promises");
const cloudinary = require("./cloudinary");

// local file Cloudinary par daalo, URL wapas do
exports.uploadToCloud = async (localPath) => {
  const result = await cloudinary.uploader.upload(localPath, {
    resource_type: "raw",
    folder: "kyphora/documents",
    public_id: `${Date.now()}-${Math.round(Math.random() * 1e6)}.enc`,
  });
  return result.secure_url;
};

// image upload (avatar wagera)
exports.uploadImageToCloud = async (localPath, folder = "kyphora/avatars") => {
  const result = await cloudinary.uploader.upload(localPath, {
    resource_type: "image",
    folder,
  });
  return result.secure_url;
};
// Cloudinary URL se file local path par utaro
exports.downloadFromCloud = async (url, destPath) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch file from Cloudinary");
  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(destPath));
};

exports.deleteFromCloud = async (url) => {
  if (!url || !url.includes("res.cloudinary.com")) return;

  const match = url.match(/\/(image|raw)\/upload\/(?:v\d+\/)?(.+)$/);
  if (!match) return;

  const resourceType = match[1];
  let publicId = decodeURIComponent(match[2]);

  // images ki public_id mein extension nahi hoti, raw mein hoti hai
  if (resourceType === "image") publicId = publicId.replace(/\.[^/.]+$/, "");

  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

// jo local files maujood hon unhein delete karo
exports.removeLocal = (...paths) => {
  paths.forEach((p) => {
    if (p && fs.existsSync(p)) fs.unlinkSync(p);
  });
};
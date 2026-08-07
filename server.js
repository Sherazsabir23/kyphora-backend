require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const authRoute= require("./routes/auth.route.js");
const passwordRoutes = require("./routes/password.route.js");
const noteRoutes = require("./routes/note.route");
const cardRoutes = require("./routes/card.routes");
const apiRoutes = require("./routes/apiKeyRoutes");
const documentRoutes = require("./routes/document.routes");
const securityRoutes = require ("./routes/security.routes")
const settingRoutes =  require("./routes/settings.routes")
const activityRoutes = require("./routes/activity.routes")
const dashboardRoutes = require("./routes/dashboard.routes")
const app = express();


// -------------------- Middlewares --------------------
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use("/uploads", express.static("uploads"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// -------------------- Database Connection --------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
  })
  .catch((err) => {
    console.log("❌ MongoDB Connection Error:", err.message);
  });


//routes 


app.use("/api", authRoute);
app.use("/api/passwords", passwordRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/cards", cardRoutes);
app.use("/api/api-keys",apiRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/security",securityRoutes );
app.use("/api/activity", activityRoutes);
app.use("/api/settings",settingRoutes);
app.use("/api/dashboard",dashboardRoutes);
//server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
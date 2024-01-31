// DOTENV
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");

const app = express();

require("dotenv").config();

const port = process.env.PORT || 5000; // Default to 3000 if PORT is not defined

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

// Middleware to parse JSON requests
app.use(express.json());

// Multer configuration for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Specify the directory where you want to store uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname); // Generate a unique filename
  },
});

const upload = multer({ storage: storage });

// Serve static files from the 'uploads' directory
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), { index: false })
);

// Sample route
app.get("/", (req, res) => {
  res.send("Hello, this is your e-commerce server!");
});

// Products routes
const productsRoutes = require("./routes/productsRoutes");

// Apply multer middleware here
app.use("/products", upload.single("image"), productsRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

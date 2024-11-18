const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const Appointment = require("./models/appointment-Model");
const Doctor = require("./models/doctor-Model");
const connectDB = require("./db");
const User = require("./models/user-Model");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const JWT_SECRET = process.env.JWT_SECRET;
app.use(express.json());
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

//Post Request

app.get("/signup", (req, res) => {
  res.render("signup", { message: null });
});

// POST route to handle signup
app.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;
  console.log("Body", req.body);

  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log("HashPassword", hashedPassword);
  try {
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });
    await newUser.save();

    // console.log("New User added:", newUser);
    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRY,
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      maxAge: 3600000,
    });
    console.log("Token", req.cookies.token);
    res.redirect("/");
  } catch (error) {
    console.error("Error adding new user:", error);

    res.status(500).send("Error adding new user");
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    console.log(user);

    if (!user) {
      return res.render("login", { message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("isMatch", isMatch);

    if (!isMatch) {
      return res.render("login", { message: "Invalid email or password." });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: "1h",
    });
    console.log("token", token);

    res.cookie("token", token, { httpOnly: true });
    res.render("profile", { user: user });
    // res.redirect(`/profile/${encodeURIComponent(user.username)}`);
  } catch (error) {
    console.error(error);
    res.render("login", { message: "Error logging in. Please try again." });
  }
});

//Logout
app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.render("login", { message: "Logout Successfully" });
});

//Middleware for Authentication
const isAuthenticated = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.render("login", { message: "No token Found" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.id = decoded.id;
    const user = User.findById(decoded.id);
    req.user = user;

    next();
  } catch (err) {
    console.error(err);
    return res.redirect("/login"); // Redirect to login if token is invalid
  }
};

//All Get Request
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/profile", isAuthenticated, async (req, res) => {
  try {
    const token = req.cookies.token;
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    res.render("profile", { user });
  } catch (error) {
    res.status(500).send("Error loading profile");
  }
});

app.get("/profile/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).send("User not found");
    }
    res.status(200).render("profile", { user });
  } catch (error) {
    res.status(500).send("Error loading profile");
  }
});

//Listen
const PORT = process.env.PORT || 3000;
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to the database", error);
  });

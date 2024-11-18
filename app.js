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
const { default: mongoose } = require("mongoose");

const app = express();
const JWT_SECRET = process.env.JWT_SECRET;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

// Middleware for authentication
const isAuthenticated = (req, res, next) => {
  const token = req.cookies.token; // Check for JWT token in cookies
  if (!token) {
    return res.redirect("/login"); // Redirect to login if not authenticated
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId; // Attach user ID to request object
    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    console.error(err);
    return res.redirect("/login"); // Redirect to login if token is invalid
  }
};

app.get("/signup", (req, res) => {
  res.render("signup", { message: null });
});

app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    // console.log(req.body);

    // Check if the user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.render("login", {
        message: "User with this email already exists.",
      });
    }

    // Generate a salt and hash the password
    const salt = await bcrypt.genSalt(10); // 10 salt rounds
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    console.log(user._id);

    // Generate a JWT token for the user
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    // Set the token in a cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // Set to true for production with HTTPS
      maxAge: 3600000,
    });

    res.redirect("/login"); // Redirect to login after successful signup
  } catch (error) {
    console.error(error);
    res.render("signup", { message: "Error signing up. Please try again." });
  }
});

app.get("/login", (req, res) => {
  res.render("login", { message: null });
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.render("login", { message: "Invalid email or password." });
    }

    // Compare the entered password with the stored hash
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.render("login", { message: "Invalid email or password." });
    }

    // Create JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    // Set the token in a cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // Set to true for production with HTTPS
      maxAge: 3600000,
    });

    // Redirect to user's profile page
    res.redirect(`/profile/${encodeURIComponent(user.username)}`);
  } catch (error) {
    console.log("Error", error);
  }
});

app.get("/logout", (req, res) => {
  // Clear the token cookie
  res.clearCookie("token");
  res.redirect("/login");
});

app.get("/profile/:username", isAuthenticated, async (req, res) => {
  try {
    const username = decodeURIComponent(req.params.username); // Decode the username from the URL
    const user = await User.findOne({ username });

    if (!user) {
      return res.redirect("/login"); // Redirect to login if user not found
    }

    res.render("profile", { user });
  } catch (error) {
    console.error("Error fetching user profile:", error.message);
    res.redirect("/login");
  }
});

app.post("/profile/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const { email, age, mobile, gender, address, photoLink } = req.body;

    const updatedUser = await User.findOneAndUpdate(
      { username },
      { email, age, mobile, gender, address, photoLink },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.render("profile", { user: req.user, error: "Update failed." });
    }

    res.redirect(`/profile/${encodeURIComponent(username)}`);
  } catch (error) {
    console.error("Error updating profile:", error.message);
    res.status(500).render("profile", {
      user: req.user,
      error: "An unexpected error occurred. Please try again later.",
    });
  }
});

app.get("/apply-doctor", (req, res) => {
  res.render("applyForDoctor");
});

app.post("/apply-doctor", async (req, res) => {
  const { userId, specialization, experience, fees } = req.body;

  if (!userId || !specialization || !experience || !fees) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (user.isDoctor) {
      return res.status(400).json({ error: "User is already a doctor." });
    }

    const doctor = await Doctor.create({
      userId: user._id,
      specialization,
      experience,
      fees,
      isDoctor: true,
    });

    user.isDoctor = true;
    await user.save();

    res.status(201).json({ message: "Application successful.", doctor });
  } catch (error) {
    console.error("Error applying as doctor:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/doctors", async (req, res) => {
  const allDoctors = await User.find({ isDoctor: true });
  if (!allDoctors) {
    return res.status(400).json({ message: "No Doctor Found" });
  }
  res.status(200).render("doctors", { doctors: allDoctors });
});

app.post("/postAppointment", async (req, res) => {
  const { date, time } = req.body;
  const doctorId = req.params.doctorId;
  const doctor = await User.findById(doctorId);

  if (!doctor) {
    return res.status(400).send("Doctor not found.");
  }

  const appointment = new Appointment({
    date,
    time,
    doctor,
  });

  await appointment.save();
  res.status(200).render("UserAppointments", { appointments: appointment });
});

app.post("/contact", async (req, res) => {
  const { username, subject, email, message } = req.body;

  const contactDetails = await Contact.create({
    username,
    subject,
    email,
    message,
  });

  res.status(200).redirect("/");
});

// Start the server
const PORT = process.env.PORT || 8000;
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to the database", error);
  });

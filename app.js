const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const passport = require("passport");
const Appointment = require("./models/appointment-Model");
const Doctor = require("./models/doctor-Model");
// const mongoose = require('./db');
const User = require("./models/user-Model");

const app = express();
const JWT_SECRET = "your_jwt_secret_key"; // Use a secure, environment-specific secret

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser()); // Use cookie-parser before your routes
// Middleware setup
app.use(
  session({
    secret: "yourSecretKey", // Replace with your own secret
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser((user, done) => {
  done(null, user.id); // Store user ID in session
});
passport.deserializeUser((id, done) => {
  // Retrieve the user from the database using the ID
  User.findById(id, (err, user) => {
    done(err, user); // Pass the user to the next middleware
  });
});

// Middleware for authentication
const isAuthenticated = (req, res, next) => {
  const token = req.cookies.token; // Assuming you are storing token in cookies
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

// Middleware to check JWT in requests for protected routes
const authenticateToken = (req, res, next) => {
  const token =
    req.cookies.token || req.headers["authorization"]?.split(" ")[1]; // Check both cookie and header
  if (!token) {
    return res.redirect("/login"); // Redirect to login if no token
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.redirect("/login"); // Redirect to login if token is invalid
    req.user = user; // Attach user information to the request object
    next();
  });
};

// Middleware to verify JWT token
function verifyToken(req, res, next) {
  const token = req.cookies.token || req.headers["authorization"];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).json({ message: "Invalid token." });
  }
}

// GET route for signup page
app.get("/signup", (req, res) => {
  res.render("signup", { message: null });
});

// POST route to handle signup
app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.render("signup", {
        message: "User with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    // Create JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "1h",
    });
    res.cookie("token", token, { httpOnly: true });
    res.redirect("/login"); // Redirect to a protected page after signup
  } catch (error) {
    console.error(error);
    res.render("signup", { message: "Error signing up. Please try again." });
  }
});

// GET route for login page
app.get("/login", (req, res) => {
  res.render("login", { message: null });
});

//   // POST route to handle login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.render("login", { message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render("login", { message: "Invalid email or password." });
    }

    // Create JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "1h",
    });
    res.cookie("token", token, { httpOnly: true });

    // Pass user details to the profile page
    // res.render('profile', { user: user, message: null }); // Redirect to profile page with user details
    res.redirect(`/profile/${encodeURIComponent(user.email)}`); // Redirect to user's profile using email
  } catch (error) {
    console.error(error);
    res.render("login", { message: "Error logging in. Please try again." });
  }
});

// Route to handle logout
app.get("/logout", (req, res) => {
  // Clear the token cookie
  res.clearCookie("token"); // Clear the token cookie to log out the user
  res.redirect("/login"); // Redirect to login page or any other page
});

app.get("/", (req, res) => {
  // Check if user is authenticated
  if (req.isAuthenticated()) {
    // User is logged in; pass user data to the template
    res.render("index", { user: req.session.user });
  } else {
    // User is not logged in; pass null or an empty object
    res.render("index", { user: null });
  }
});

// // GET route for user profile by email
app.get("/profile/:email", isAuthenticated, async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email); // Decode the email from the URL
    const user = await User.findOne({ email }); // Find user by
    console.log(req.session.user);

    if (!user) {
      return res.redirect("/login"); // Redirect if user not found
    }

    res.render("profile", { user }); // Render profile page with user data
  } catch (error) {
    console.error(error);
    res.redirect("/login"); // Redirect to login on error
  }
});

// POST route to update user profile
app.post("/profile", async (req, res) => {
  try {
    const { username, email, age, mobile, gender, address, photoLink } =
      req.body;
    const userId = req.user.userId; // Assuming you are storing user ID in the request object (from JWT)

    // Update user in the database
    await User.findByIdAndUpdate(userId, {
      username,
      email, // Include email in the update
      age,
      mobile,
      gender,
      address,
      photoLink,
    });

    // Find the updated user to pass updated data to the profile page
    const updatedUser = await User.findById(userId);

    // Render the profile page with updated user data
    res.render("profile", {
      user: updatedUser,
      success: "Profile updated successfully!",
    });
  } catch (error) {
    console.error(error);
    res.render("profile", {
      user: req.user,
      error: "Error updating profile. Please try again.",
    });
  }
});

// Route for doctor application
app.get("/apply-doctor", authenticateToken, (req, res) => {
  res.render("applyForDoctor");
});
// POST route to handle form submission
app.post("/apply-doctor", async (req, res) => {
  const { specialization, experience, fees } = req.body;

  try {
    // Assuming you have the user's ID stored in the session
    const userId = req.session.userId; // Example user ID, replace with actual user retrieval method

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }

    // Create a new Doctor document
    const newDoctor = new Doctor({
      userId: user._id,
      specialization,
      experience,
      fees,
      isDoctor: true, // Set to true since they are applying to be a doctor
    });

    // Save the doctor to the database
    await newDoctor.save();

    // Update the user to reflect they are a doctor
    user.isDoctor = true;
    await user.save();

    res.send("You have successfully applied to be a doctor!");
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while applying to be a doctor");
  }
});

// app.get("/book-appointment", (req, res) => {
//   res.render("bookAppointment");
// });

// app.get("/user-appointment", (req, res) => {
//   res.render("UserAppointments");
// });
//This Code is Written by waseem's father = Samar

// app.get("/book-appointment/:doctorId", async (req, res) => {
//   const { doctorId } = req.params;
//   const doctor = await User.findById(doctorId);
//   res.render("bookAppointment", { doctor: doctor });
// });

// app.get("/doctors", (req, res) => {
//   res.render("doctors");
// });

app.post("/postAppointment", async (req, res) => {
  const { date, time } = req.body;
  const doctorId = req.params;
  const doctor = await User.findById(doctorId);
  const appointment = await Appointment.create({
    date,
    time,
    doctor,
  });
  res.status(200).render("UserAppointments", { appointments: appointment });
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
    res.status(400).json({ message: "No Doctor Found" });
  }
  res.status(200).render("doctors", { doctors: allDoctors });
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
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

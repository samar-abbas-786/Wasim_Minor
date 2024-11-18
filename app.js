const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const passport = require("passport");
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
// Middleware setup

// Middleware for authentication
// const isAuthenticated = (req, res, next) => {
//   const token = req.cookies.token; // Assuming you are storing token in cookies
//   if (!token) {
//     return res.redirect("/login"); // Redirect to login if not authenticated
//   }

//   try {
//     const decoded = jwt.verify(token, JWT_SECRET);
//     req.userId = decoded.userId; // Attach user ID to request object
//     next(); // Proceed to the next middleware or route handler
//   } catch (err) {
//     console.error(err);
//     return res.redirect("/login"); // Redirect to login if token is invalid
//   }
// };

// Middleware to check JWT in requests for protected routes

app.get("/signup", (req, res) => {
  res.render("signup", { message: null });
});

// app.post("/signup", async (req, res) => {
//   try {
//     const { username, email, password } = req.body;
//     const existingUser = await User.findOne({ email });

//     if (existingUser) {
//       return res.render("login", {
//         message: "User with this email already exists.",
//       });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const user = new User({ username, email, password: hashedPassword });
//     await user.save();

//     const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
//       expiresIn: "1h",
//     });
//     res.cookie("token", token, { httpOnly: true });
//     res.redirect("/login");
//   } catch (error) {
//     console.error(error);
//     res.render("signup", { message: "Error signing up. Please try again." });
//   }
// });

app.get("/login", (req, res) => {
  res.render("login", { message: null });
});

app.get("/", (req, res) => {
  res.render("index");
});
app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.render("login", {
        message: "User with this email already exists.",
      });
    }

    // Generate a salt
    const salt = await bcrypt.genSalt(10); // 10 salt rounds

    // Hash the password with the generated salt
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    // Generate a JWT token for the user
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    // Set the token in a cookie
    res.cookie("token", token);

    // Redirect to login page
    res.redirect("/login");
  } catch (error) {
    console.error(error);
    res.render("signup", { message: "Error signing up. Please try again." });
  }
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
    /*
    //Store local storage in forntend





    \

    */
    // Create JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "1h",
    });
    res.cookie("token", token, { httpOnly: true });
    console.log(user);
    // Pass user details to the profile page
    // res.render('profile', { user: user, message: null }); // Redirect to profile page with user details
    res.redirect(`/profile/${encodeURIComponent(user.username)}`); // Redirect to user's profile using email
  } catch (error) {
    console.log("Error", error);
  }
});
app.get("/getProfile", (req, res) => {});

// Create JWT token

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
app.get("/profile/:username", isAuthenticated, async (req, res) => {
  try {
    const username = decodeURIComponent(req.params.username); // Decode the email from the URL
    const user = await User.findOne({ username }); // Find user by
    console.log(req.session.user);

    if (!user) {
      return res.redirect("/login"); // Redirect if user not found
    }

    res.render("profile", { user }); // Render profile page with user data
  } catch (error) {
    console.error("Error fetching user profile:", error.message);
    res.redirect("/login");
  }
});
app.post("/profile/:username", async (req, res) => {
  try {
    const { username } = req.params;

    // Check if user is logged in and matches the profile username

    const { email, age, mobile, gender, address, photoLink } = req.body;

    const updatedUser = await User.findOneAndUpdate(
      { username },
      { email, age, mobile, gender, address, photoLink },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.render("profile", {
        user: req.user,
        error: "User not found or update failed.",
      });
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

// Route for doctor application
app.get("/apply-doctor", (req, res) => {
  res.render("applyForDoctor");
});
// POST route to handle form submission
// app.post("/apply-doctor", async (req, res) => {
//   const { specialization, experience, fees } = req.body;

//   try {
//     // Assuming you have the user's ID stored in the session

//     // Check if user exists
//     // const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).send("User not found");
//     }

// Create a new Doctor document
// const newDoctor = new Doctor({
//   userId: user._id,
//   specialization,
//   experience,
//   fees,
//   isDoctor: true, // Set to true since they are applying to be a doctor
// });

// Save the doctor to the database
//     await newDoctor.save();

//     // Update the user to reflect they are a doctor
//     user.isDoctor = true;
//     await user.save();

//     res.send("You have successfully applied to be a doctor!");
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("An error occurred while applying to be a doctor");
//   }
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

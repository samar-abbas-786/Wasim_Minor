const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.ObjectId,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  email: {
    type: email,
    required: true,
    unique: true,
  },
});

const Contact = mongoose.model("Contact", contactSchema);
module.exports = Contact;

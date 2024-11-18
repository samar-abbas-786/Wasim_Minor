const mongoose = require("mongoose");

const schema = mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      // minLength: [5,"Password must be greater than 5 in terms of size"]
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isDoctor: {
      type: Boolean,
      default: false,
    },
    age: {
      type: Number,
      // default: "",
    },
    gender: {
      type: String,
      // default: "neither",
    },
    mobile: {
      type: Number,
      // default: "",
    },
    address: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      default: "pending",
    },
    photoLink: {
      type: String,
      default:
        "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
    },
    subject: {
      type: String,
      // required: true,
    },
    message: {
      type: String,
      // required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const User = mongoose.model("User", schema);

module.exports = User;

// firstname: {
//   type: String,
//   required: true,

// },
// lastname: {
//   type: String,
//   required: true,
// },

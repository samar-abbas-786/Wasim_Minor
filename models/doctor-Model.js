const mongoose = require("mongoose");
// mongoose.connect('mongodb://127.0.0.1:27017/MinorProject')

const schema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User",
      required: true,
    },
    specialization: {
      type: String,
      required: true,
    },
    experience: {
      type: Number,
      required: true,
    },
    fees: {
      type: Number,
      required: true,
    },
    isDoctor: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey : false
  }
);

const Doctor = mongoose.model("Doctor", schema);

module.exports = Doctor;
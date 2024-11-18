const mongoose = require("mongoose");
const connectDB = async () => {
  try {
    console.log(process.env.MONGO_URI);
    const connectionInstance = await mongoose.connect(
      `mongodb://localhost:27017/Waseem_Minor`
    );
    console.log(
      `MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error(`MongoDB connection failed : ${error.message}`);
    process.exit(1);
  }
};
module.exports = connectDB;

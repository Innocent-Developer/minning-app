const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_ADMIN_URL, {

    });

    console.log(`Database connected successfully: ${mongoose.connection.name}`);
  } catch (err) {
    console.error("DB CONNECTION ERROR:", err);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;

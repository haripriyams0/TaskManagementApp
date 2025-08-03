const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected successfully');
        } catch (err) {
            console.error(err.message);
            process.exit(1);    
        }    
};

module.exports = connectDB;
// This module exports a function to connect to MongoDB using Mongoose.
// It handles connection errors and logs a success message upon successful connection.
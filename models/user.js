const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    course: {
        type: String,
        enum: ['B.Tech'],
        default: 'B.Tech'
    },
    year: {
        type: String,
        enum: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
        required: true
    },
    branch: {
        type: String,
        enum: ['Computer Engineering'],
        default: 'Computer Engineering'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model("User", userSchema);
module.exports = User;

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const adminSchema = new Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    department: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;

const mongoose = require('mongoose');

const Employee = new mongoose.Schema({
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    birthdate: { type: Date, required: true },
    age: { type: Number, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
});

module.exports = mongoose.model('User', Employee);

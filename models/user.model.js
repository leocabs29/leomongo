const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  age: { type: Number, required: true },
  status: { type: String, enum: ['online', 'offline'], default: 'offline' },
  messages: [messageSchema]  // Array of message objects
});

const User = mongoose.model('User', userSchema);

module.exports = User;

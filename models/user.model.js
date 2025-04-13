const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  status: { type: String, enum: ['online', 'offline'], default: 'offline' },
  messages: [messageSchema]
});

const User = mongoose.model('User', userSchema);

module.exports = User;
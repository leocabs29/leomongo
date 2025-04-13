const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  age: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['online', 'offline'], 
    default: 'offline'  // Default set to 'offline'
  },
  messages: [messageSchema]  // Array of message objects
});

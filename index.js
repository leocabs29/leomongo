require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// Use the port that Vercel provides, or 3000 for local development
const port = process.env.PORT || 3000;

// Enable CORS
app.use(cors({
  origin: ['http://localhost:5173', 'https://globalchatleocabs.netlify.app']
}));

// Middleware to parse JSON requests
app.use(express.json());

// Ensure MONGO_URI is set in the environment variables
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
  console.error("MongoDB URI is not set in the environment variables.");
  process.exit(1); // Exit if the connection string is missing
}

// Connect to MongoDB using an environment variable for production
mongoose.connect(mongoURI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('Could not connect to MongoDB', err);
    process.exit(1);
  });

// Define the User model
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

// Route to get all users
app.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err.message);
    res.status(500).send('Error fetching users');
  }
});

// Route to create a new user
app.post('/users', async (req, res) => {
  const { name, email, age } = req.body;

  if (!name || !email || !age) {
    return res.status(400).send('Name, email, and age are required');
  }

  try {
    const newUser = new User({ name, email, age });
    await newUser.save();

    res.status(201).json(newUser);
  } catch (err) {
    console.error('Error creating user:', err.message);
    res.status(500).send('Error creating user');
  }
});

// Route to update user status (online/offline)
app.put('/users/:id/status', async (req, res) => {
  const { status } = req.body;

  if (!['online', 'offline'].includes(status)) {
    return res.status(400).send('Invalid status value');
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: status },
      { new: true }
    );

    if (!user) {
      return res.status(404).send('User not found');
    }

    res.json(user);
  } catch (err) {
    console.error('Error updating status:', err.message);
    res.status(500).send('Error updating status');
  }
});

// Route to add a message for a user
app.post('/users/:id/messages', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).send('Message text is required');
  }

  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).send('User not found');
    }

    user.messages.push({ text });
    await user.save();

    res.status(201).json(user);
  } catch (err) {
    console.error('Error adding message:', err.message);
    res.status(500).send('Error adding message');
  }
});

// Default route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Start the server
app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});

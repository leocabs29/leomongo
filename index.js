require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// Use the port that Vercel provides, or 3000 for local development
const port = process.env.PORT || 3000;

// Enable CORS
app.use(cors({
  origin: 'http://localhost:5173','https://globalchatleocabs.netlify.app/'
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

// Define the User model (can be split into another file for organization)
const User = mongoose.model('User', new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}));

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
  const { name, username, password } = req.body;

  if (!name || !username || !password) {
    return res.status(400).send('Name, username, and password are required');
  }

  try {
    const newUser = new User({ name, username, password });
    await newUser.save();

    res.status(201).json(newUser);
  } catch (err) {
    console.error('Error creating user:', err.message);
    res.status(500).send('Error creating user');
  }
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Start the server
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

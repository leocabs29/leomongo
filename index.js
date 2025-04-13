const express = require('express');
const mongoose = require('mongoose');
const app = express();
require('dotenv').config();

// Use the port that Vercel provides, or 3000 for local development
const port = process.env.PORT || 3000;

// Connect to MongoDB using an environment variable for production
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// Middleware to parse JSON requests
app.use(express.json());

// Define the User model (you can import it from another file if you want)
const User = mongoose.model('User', new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: Number, required: true }
}));

// Route to get all users
app.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).send('Error fetching users');
  }
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

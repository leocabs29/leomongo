require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const socketIo = require('socket.io');
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

// Define the User schema with messages
const messageSchema = new mongoose.Schema({
  text: { type: String, required: true },
  senderName: { type: String, required: true },
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

// Route to get all users and their messages
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

// Route to send a message to the global chat
app.post('/users/:id/messages', async (req, res) => {
  const { text, senderName } = req.body;

  if (!text || !senderName) {
    return res.status(400).send('Message text and sender name are required');
  }

  try {
    // Find the user (you can also choose not to link the message to a specific user)
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).send('User not found');
    }

    // Add the new message to the user's message array
    user.messages.push({ text, senderName });

    await user.save();

    // Broadcast the message to all connected clients using Socket.io
    io.emit('new_message', { text, senderName, timestamp: new Date() });

    res.status(201).json(user);  // Respond with the updated user (optional)
  } catch (err) {
    console.error('Error adding message:', err.message);
    res.status(500).send('Error adding message');
  }
});

// Default route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Start the server and initialize Socket.io
const server = app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});

// Initialize Socket.io
const io = socketIo(server);

// Real-time communication: Emit events when users send messages
io.on('connection', (socket) => {
  console.log('New client connected');

  // Listen for new messages from clients
  socket.on('send_message', (messageData) => {
    // Find a user to attach the message to, if you want
    User.findOne({ email: messageData.senderEmail })
      .then(user => {
        if (user) {
          // Save the message in the user's messages array
          user.messages.push({
            text: messageData.text,
            senderName: messageData.senderName,
            timestamp: new Date()
          });
          user.save()
            .then(() => {
              // Broadcast the new message to all clients
              io.emit('new_message', { text: messageData.text, senderName: messageData.senderName, timestamp: new Date() });
            })
            .catch(err => {
              console.error('Error saving message:', err.message);
            });
        }
      })
      .catch(err => {
        console.error('Error finding user:', err.message);
      });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

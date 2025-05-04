require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Connect Database
connectDB();

const app = express();

// Init Middleware
app.use(cors()); // Enable CORS for all origins (adjust for production)
app.use(express.json({ extended: false })); // Body parser

// Define Routes
app.get('/', (req, res) => res.send('API Running')); // Simple test route
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/requests', require('./routes/requestRoutes'));
app.use('/api/users', require('./routes/userRoutes')); // For admin actions
app.use('/api/chat', require('./routes/chatRoutes')); // Project chat
app.use('/api/private-chat', require('./routes/privateChatRoutes')); // 1-on-1 chat
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/supervisor', require('./routes/supervisorIdeaRoutes'));
app.use('/api/recruiter', require('./routes/sponsoredProjectRoutes'));

// Error Handling Middleware (Example - Needs more robust implementation)
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).send('Server Error');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`)); 
require('dotenv').config({ quiet: true });
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const initCronJobs = require('./services/cronService');
const http = require('http');
const { Server } = require('socket.io');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const businessRoutes = require('./routes/businessRoutes');
const itemRoutes = require('./routes/itemRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const customerRoutes = require('./routes/customerRoutes');
const queryRoutes = require('./routes/queryRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const proxyRoutes = require('./routes/proxyRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins (use specific origin in production)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Socket.io connection logic
io.on('connection', (socket) => {
  // console.log(`User Connected: ${socket.id}`);

  socket.on('join_room', (room) => {
    socket.join(room);
    // console.log(`User with ID: ${socket.id} joined room: ${room}`);
  });

  socket.on('disconnect', () => {
    // console.log('User Disconnected', socket.id);
  });
});

// Make io accessible to our router
app.set('io', io);

// Connect Database
connectDB();

// Initialize Cron Jobs
initCronJobs();

// Middleware
app.use(
  cors({
    origin: '*', // Allow all URLs
  }),
);
app.use(express.json()); // Parse JSON bodies
app.use(morgan('dev')); // Logging

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/queries', queryRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/proxy', proxyRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: err.message || 'Internal Server Error',
  });
});

app.get('/', (req, res) => {
  res.send('Invoice Backend is running');
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

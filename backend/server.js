require('dotenv').config({ quiet: true });
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const businessRoutes = require('./routes/businessRoutes');
const itemRoutes = require('./routes/itemRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const customerRoutes = require('./routes/customerRoutes');

const app = express();

// Connect Database
connectDB();

// Middleware
app.use(cors({
  origin: '*' // Allow all URLs
}));
app.use(express.json()); // Parse JSON bodies
app.use(morgan('dev')); // Logging

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/invoices', invoiceRoutes);

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

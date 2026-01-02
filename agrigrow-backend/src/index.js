import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import { initPinecone } from './config/pinecone.js';
import cropDoctorRoutes from './routes/cropDoctor.js';
import schemesRoutes from './routes/schemes.js';
import voiceRoutes from './routes/voice.js';
import marketRoutes from './routes/market.js';
import farmerRoutes from './routes/farmer.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Allowed CORS origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:3000',
  process.env.CORS_ORIGIN
].filter(Boolean);

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins in development
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Initialize databases
await connectDB();
await initPinecone();

// Routes
app.use('/api/crop-doctor', cropDoctorRoutes);
app.use('/api/schemes', schemesRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/farmer', farmerRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 AgroTech Backend running on http://localhost:${PORT}`);
});

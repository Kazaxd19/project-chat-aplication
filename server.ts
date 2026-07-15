import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import { setupWebSocket } from './sockets/chat.socket.js';

// טעינת משתני סביבה 
dotenv.config();

// חיבור ל-DB
connectDB();

const app = express();

// Middlewares 
app.use(cors({ origin: 'http://localhost:5173', credentials: true })); // התאם את ה-origin לכתובת ה-Client שלך
app.use(express.json());
app.use(cookieParser());
// Routes
app.use('/auth', authRoutes);
app.use('/', usersRoutes);

// הגדרת האזנה לפורט 3000 ושמירת מופע השרת
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// הפעלת שרת ה-WebSocket על גבי השרת הקיים
setupWebSocket(server);

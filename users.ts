import express from 'express';
import User from '../models/User.js';
import Message from '../models/Message.js';
import { isLoggedIn } from '../middleware/isLoggedIn.js';

const router = express.Router();

// 7.1 GET /users - שליפת רשימת משתמשים
router.get('/users', isLoggedIn, async (req, res) => {
  try {
    // שולפים רק את השדות הנחוצים
    const users = await User.find({}, 'username profileImage');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// 7.2 GET /messages - שליפת 100 הודעות אחרונות
router.get('/messages', isLoggedIn, async (req, res) => {
  try {
    const messages = await Message.find()
      .sort({ timestamp: -1 }) // ממיינים מהחדש לישן
      .limit(100) // מגבילים ל-100 הודעות
      .populate('sender', 'username profileImage'); // שואבים את פרטי השולח

    // הופכים את המערך חזרה כדי שההודעות יוצגו בסדר כרונולוגי תקין במסך
    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

export default router;
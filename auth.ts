import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // חובה .js
import { upload, uploadToS3 } from '../middleware/upload.js';
import { signupSchema, loginSchema } from '../schemas/auth.schema.js';
import { isLoggedIn } from '../middleware/isLoggedIn.js';

const router = express.Router();

//  POST /auth/signup - הרשמה
// משתמשים ב-upload.single('profileImage') כדי לקבל את התמונה מהבקשה
router.post('/signup', upload.single('profileImage'), async (req, res): Promise<void> => {
  try {
    // 1. ולידציה של הנתונים עם Joi
    const { error } = signupSchema.validate(req.body);
    if (error) {
       res.status(400).json({ message: error.details[0].message });
       return;
    }

    const { email, username, password } = req.body;

    // 2. בדיקה אם המשתמש כבר קיים במסד הנתונים
    const existingUser = await User.findOne({ email });
    if (existingUser) {
       res.status(400).json({ message: 'User already exists with this email' });
       return;
    }

    //  הצפנת הסיסמה בעזרת bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    //  העלאת התמונה ל-AWS S3 (אם המשתמש שלח אחת)
    let profileImageUrl = '';
    if (req.file) {
      profileImageUrl = await uploadToS3(req.file);
    }

    //  שמירת המשתמש החדש במסד הנתונים
    const newUser = new User({
      email,
      username,
      password: hashedPassword,
      profileImage: profileImageUrl,
    });

    await newUser.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error in signup:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

//  POST /auth/login - התחברות
router.post('/login', async (req, res): Promise<void> => {
  try {
    //  ולידציה של הנתונים
    const { error } = loginSchema.validate(req.body);
    if (error) {
       res.status(400).json({ message: error.details[0].message });
       return;
    }

    const { email, password } = req.body;

    //  חיפוש המשתמש
    const user = await User.findOne({ email });
    if (!user) {
       res.status(400).json({ message: 'Invalid credentials' });
       return;
    }

    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
       res.status(400).json({ message: 'Invalid credentials' });
       return;
    }

    //  יצירת JWT טוקן
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET as string, 
      { expiresIn: '7d' }
    );

    //  שליחת הטוקן בתוך עוגייה (Cookie) מאובטחת
    res.cookie('token', token, {
      httpOnly: true, // מונע גישה לעוגייה מצד הלקוח (הגנה מ-XSS)
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ימים
    });

    // מחזירים גם את פרטי המשתמש כדי שהצד לקוח יוכל להציג אותם
    res.json({ 
        message: 'Logged in successfully', 
        user: { _id: user._id, username: user.username, profileImage: user.profileImage } 
    });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

//  GET /auth/me - קבלת פרטי המשתמש המחובר
// שים לב שאנחנו משתמשים במידלוור isLoggedIn לפני הלוגיקה
router.get('/me', isLoggedIn, async (req, res) => {
  // אם הגענו לכאן, המידלוור כבר אימת את הטוקן והכניס את המשתמש ל-req.user
  res.json({ user: req.user });
});

export default router;
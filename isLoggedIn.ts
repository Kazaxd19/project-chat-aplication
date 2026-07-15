import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User.js'; // שים לב לסיומת ה-.js

// הרחבת הטיפוס של בקשת Express כדי שנוכל להוסיף את המשתמש
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const isLoggedIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // קריאת הטוקן מהעוגיות
    const token = req.cookies.token;

    if (!token) {
      res.status(401).json({ message: 'Unauthorized - No token provided' });
      return;
    }

    // פענוח ואימות הטוקן
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
    
    // שליפת המשתמש ממסד הנתונים (ללא הסיסמה)
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      res.status(401).json({ message: 'Unauthorized - User not found' });
      return;
    }

    // הוספת המשתמש לאובייקט הבקשה כדי שראוטים הבאים יוכלו לגשת אליו
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized - Invalid token' });
  }
};
import multer from 'multer';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
// שים לב לסיומת ה-js בייבוא, בדיוק כמו שלמדנו קודם כדי למנוע שגיאות
import s3Client from '../config/s3.js'; 

// 4.3 - הגדרת Multer לשמירה בזיכרון
const storage = multer.memoryStorage();
export const upload = multer({ storage });

// 4.4 - פונקציה שמקבלת קובץ ומעלה אותו ל-S3
export const uploadToS3 = async (file: Express.Multer.File): Promise<string> => {
  // חילוץ סיומת הקובץ המקורית (למשל .jpg או .png)
  const extension = path.extname(file.originalname);
  
  // יצירת שם קובץ ייחודי לחלוטין
  const uniqueFilename = `${uuidv4()}${extension}`;

  const bucketName = process.env.AWS_BUCKET_NAME as string;
  const region = process.env.AWS_REGION as string;

  // הגדרת הפקודה להעלאת הקובץ ל-AWS
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: uniqueFilename,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  // שליחה ל-S3
  await s3Client.send(command);

  // יצירת הקישור הציבורי של התמונה והחזרתו
  return `https://${bucketName}.s3.${region}.amazonaws.com/${uniqueFilename}`;
};
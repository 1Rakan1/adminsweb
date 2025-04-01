import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config(); // تحميل متغيرات البيئة من ملف .env

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB Connected Successfully');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1); // إنهاء التطبيق في حال فشل الاتصال
  }
};

export default connectDB;

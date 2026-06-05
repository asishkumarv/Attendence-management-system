import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import cron from 'node-cron';
import routes from './routes';

dotenv.config();

const app = express();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

app.use(cors());
app.use(express.json());

app.use('/api', routes);

const PORT = process.env.PORT || 5000;

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// CRON JOB: Every day at 11:59 PM (23:59), auto log-off active employees
cron.schedule('59 23 * * *', async () => {
  console.log('Running auto log-off cron job at 11:59 PM...');
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const today = formatter.format(new Date());

    // Find all attendance records for today where logoffTime is null
    const activeAttendances = await prisma.attendance.findMany({
      where: {
        date: today,
        logoffTime: null,
      },
    });

    for (const record of activeAttendances) {
      // Auto-close open breaks if any
      const openBreaks = await prisma.break.findMany({
        where: {
          attendanceId: record.id,
          breakEndTime: null,
        }
      });
      
      const now = new Date();
      now.setHours(23, 59, 0, 0);

      // Close open breaks
      for (const b of openBreaks) {
        await prisma.break.update({
          where: { id: b.id },
          data: { breakEndTime: now }
        });
      }

      // Calculate total working minutes properly later, for now we just mark logoff
      await prisma.attendance.update({
        where: { id: record.id },
        data: {
          logoffTime: now,
          autoLoggedOff: true
        }
      });
      console.log(`Auto logged off user ${record.userId}`);
    }
  } catch (error) {
    console.error('Error in auto log-off cron job:', error);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

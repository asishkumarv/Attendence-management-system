import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import axios from 'axios';
import multer from 'multer';
import FormData from 'form-data';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { verifyToken, isAdmin, AuthRequest } from './middleware/auth';

dotenv.config();

const router = Router();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL || 'http://127.0.0.1:5001';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

const upload = multer({ storage: multer.memoryStorage() });

// Timezone hacks to force the database to visually display the local time
const toDbTime = (d = new Date()) => {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000);
};

const fromDbTime = (d: Date | null | undefined) => {
  if (!d) return d;
  return new Date(d.getTime() + d.getTimezoneOffset() * 60000);
};

/**
 * =======================
 * AUTH ENDPOINTS
 * =======================
 */

router.post('/auth/register', upload.single('image'), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!password) return res.status(400).json({ error: 'Password is required' });
    if (!req.file) return res.status(400).json({ error: 'Face image is required' });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'Email already registered' });

    const formData = new FormData();
    formData.append('image', req.file.buffer, 'face.jpg');

    const pythonRes = await axios.post(`${FACE_SERVICE_URL}/encode`, formData, {
      headers: formData.getHeaders()
    });

    const faceEncoding = JSON.stringify(pythonRes.data.encoding);
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        face_encoding: faceEncoding,
        status: 'PENDING',
        role: 'EMPLOYEE'
      }
    });

    res.json({ message: 'Registration successful, pending admin approval', user: { id: newUser.id, name: newUser.name, email: newUser.email } });
  } catch (error: any) {
    console.error('Registration error:', error.response?.data || error.message || error);
    res.status(500).json({ error: error.response?.data?.error || 'Registration failed' });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.status !== 'APPROVED') return res.status(403).json({ error: 'Account pending or rejected' });
    if (!user.password) return res.status(400).json({ error: 'Please set up a password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '12h' });

    res.json({ message: 'Login successful', token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error: any) {
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * =======================
 * ADMIN ENDPOINTS
 * =======================
 */

router.get('/admin/employees', isAdmin, async (req, res) => {
  try {
    const employees = await prisma.user.findMany({
      where: { role: 'EMPLOYEE' },
      select: { id: true, name: true, email: true, status: true, createdAt: true }
    });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put('/admin/employees/:id/status', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id as string) },
      data: { status },
      select: { id: true, name: true, email: true, status: true }
    });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/admin/holidays', isAdmin, async (req, res) => {
  try {
    const { date, description } = req.body;
    const d = new Date(date);
    const holiday = await prisma.holiday.create({
      data: {
        date: d.toLocaleDateString('en-CA'),
        description
      }
    });
    res.json(holiday);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/admin/holidays/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.holiday.delete({ where: { id: parseInt(id as string) } });
    res.json({ message: 'Holiday deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/admin/stats', isAdmin, async (req, res) => {
  try {
    let attendances: any[] = await prisma.attendance.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { date: 'desc' }
    });
    attendances = attendances.map(a => {
      const realLoginTime = fromDbTime(a.loginTime) as Date;
      const realLogoffTime = fromDbTime(a.logoffTime) as Date;
      return {
        ...a,
        loginTime: realLoginTime,
        logoffTime: realLogoffTime
      };
    });
    res.json(attendances);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * =======================
 * EMPLOYEE ENDPOINTS
 * =======================
 */

router.get('/employee/stats', verifyToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    let stats: any[] = await prisma.attendance.findMany({
      where: { userId },
      orderBy: { date: 'desc' }
    });
    stats = stats.map(a => {
      const realLoginTime = fromDbTime(a.loginTime) as Date;
      const realLogoffTime = fromDbTime(a.logoffTime) as Date;
      return {
        ...a,
        loginTime: realLoginTime,
        logoffTime: realLogoffTime
      };
    });
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/employee/holidays', verifyToken, async (req, res) => {
  try {
    const holidays = await prisma.holiday.findMany({ orderBy: { date: 'asc' } });
    res.json(holidays);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch holidays' });
  }
});

const getLocalDateString = (d: Date) => {
  return d.toISOString().split('T')[0];
};

async function isTodayHoliday() {
  const today = getLocalDateString(new Date());
  const holiday = await prisma.holiday.findUnique({
    where: { date: today }
  });
  return !!holiday;
}

// 2. Face Login (Attendance In) - Requires JWT Auth as well for extra security
router.post('/employee/terminal/login', verifyToken, upload.single('image'), async (req: AuthRequest, res) => {
  try {
    if (await isTodayHoliday()) {
      return res.status(403).json({ error: 'Today is a holiday. Cannot login.' });
    }

    const userId = req.user!.id;
    if (!req.file) return res.status(400).json({ error: 'Face image is required' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status !== 'APPROVED') return res.status(403).json({ error: 'User not found or pending' });

    const formData = new FormData();
    formData.append('image', req.file.buffer, 'face.jpg');
    formData.append('known_encoding', user.face_encoding!);

    const pythonRes = await axios.post(`${FACE_SERVICE_URL}/verify`, formData, {
      headers: formData.getHeaders()
    });

    if (!pythonRes.data.match) return res.status(401).json({ error: 'Face does not match your profile' });

    const loginTime = toDbTime();
    const today = getLocalDateString(loginTime);

    const attendance = await prisma.attendance.upsert({
      where: { userId_date: { userId, date: today } },
      update: { loginTime },
      create: { userId, date: today, loginTime }
    });

    res.json({ message: 'Login successful', attendance });
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || 'Login failed' });
  }
});

// 3. Face Logoff (Attendance Out)
router.post('/employee/terminal/logoff', verifyToken, upload.single('image'), async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    if (!req.file) return res.status(400).json({ error: 'Face image is required' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const formData = new FormData();
    formData.append('image', req.file.buffer, 'face.jpg');
    formData.append('known_encoding', user.face_encoding!);

    const pythonRes = await axios.post(`${FACE_SERVICE_URL}/verify`, formData, {
      headers: formData.getHeaders()
    });

    if (!pythonRes.data.match) return res.status(401).json({ error: 'Face does not match your profile' });

    const today = getLocalDateString(toDbTime());

    const attendance = await prisma.attendance.findUnique({
      where: { userId_date: { userId, date: today } }
    });

    if (!attendance || !attendance.loginTime) return res.status(400).json({ error: 'You must login first' });

    const openBreaks = await prisma.break.findMany({
      where: { attendanceId: attendance.id, breakEndTime: null }
    });
    
    for (const b of openBreaks) {
      await prisma.break.update({ where: { id: b.id }, data: { breakEndTime: toDbTime() } });
    }

    const logoffTime = toDbTime();
    const diffMs = logoffTime.getTime() - attendance.loginTime.getTime();
    const totalWorkingMinutes = Math.floor(diffMs / 60000);

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: { logoffTime, totalWorkingMinutes }
    });

    res.json({ message: 'Logoff successful', attendance: updated });
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || 'Logoff failed' });
  }
});

// 4. Break In
router.post('/employee/terminal/break-in', verifyToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const today = getLocalDateString(toDbTime());

    const attendance = await prisma.attendance.findUnique({
      where: { userId_date: { userId, date: today } }
    });

    if (!attendance || !attendance.loginTime || attendance.logoffTime) {
      return res.status(400).json({ error: 'You can only take a break during an active shift' });
    }

    const activeBreak = await prisma.break.findFirst({
      where: { attendanceId: attendance.id, breakEndTime: null }
    });

    if (activeBreak) return res.status(400).json({ error: 'You are already on a break' });

    const newBreak = await prisma.break.create({ data: { attendanceId: attendance.id } });

    res.json({ message: 'Break started', break: newBreak });
  } catch (error) {
    res.status(500).json({ error: 'Break in failed' });
  }
});

// 5. Break Out
router.post('/employee/terminal/break-out', verifyToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const today = getLocalDateString(toDbTime());

    const attendance = await prisma.attendance.findUnique({
      where: { userId_date: { userId, date: today } }
    });

    if (!attendance) return res.status(400).json({ error: 'No active attendance' });

    const activeBreak = await prisma.break.findFirst({
      where: { attendanceId: attendance.id, breakEndTime: null }
    });

    if (!activeBreak) return res.status(400).json({ error: 'You are not currently on a break' });

    const updatedBreak = await prisma.break.update({
      where: { id: activeBreak.id },
      data: { breakEndTime: new Date() }
    });

    res.json({ message: 'Break ended', break: updatedBreak });
  } catch (error) {
    res.status(500).json({ error: 'Break out failed' });
  }
});

export default router;

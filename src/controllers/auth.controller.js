import prisma from '../prisma/client.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password required' });
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const ok = await bcrypt.compare(password, user.passwordHash); // Schema uses passwordHash
        if (!ok) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                role: user.role,
                departmentId: user.departmentId
            }
        });
    } catch (err) {
        next(err);
    }
};

export const register = async (req, res, next) => {
    try {
        const { email, name, password, role, departmentId } = req.body;

        // 1. ตรวจสอบข้อมูลเบื้องต้น (removed empId)
        if (!email || !name || !password || !role) {
            return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }

        // 2. ตรวจสอบว่า departmentId เป็น format ของ MongoDB ObjectId หรือไม่ (ถ้ามีส่งมา)
        if (departmentId && !/^[0-9a-fA-F]{24}$/.test(departmentId)) {
            return res.status(400).json({ message: 'รหัสแผนกไม่ถูกต้อง' });
        }

        // 3. ป้องกันไม่ให้สมัครเป็น ADMIN ผ่าน API นี้
        if (role !== 'EVALUATOR' && role !== 'EVALUATEE') {
            return res.status(403).json({ message: 'สามารถสมัครได้เฉพาะสิทธิ์ EVALUATOR หรือ EVALUATEE เท่านั้น' });
        }

        // 3. ตรวจสอบอีเมลซ้ำ
        const exists = await prisma.user.findUnique({
            where: { email }
        });

        if (exists) {
            return res.status(409).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว' });
        }

        // 4. Hash รหัสผ่าน
        const passwordHash = await bcrypt.hash(password, 10);

        // 5. บันทึกข้อมูลผู้ใช้
        const user = await prisma.user.create({
            data: {
                email,
                name,
                passwordHash, // อ้างอิงจาก schema.prisma ฟิลด์ชื่อ passwordHash
                role,
                departmentId: departmentId || null
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                departmentId: true,
                createdAt: true
            }
        });

        res.status(201).json({
            message: 'สมัครสมาชิกสำเร็จ',
            user
        });

    } catch (err) {
        next(err);
    }
};

export const me = async (req, res) => {
    res.json({ user: req.user });
};

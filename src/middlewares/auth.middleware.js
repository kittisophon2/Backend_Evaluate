import jwt from 'jsonwebtoken';
import prisma from '../prisma/client.js';

export default async function auth(req, res, next) {
    try {
        const header = req.headers.authorization;

        if (!header || !header.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const token = header.split(' ')[1];
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        // ดึง user จาก DB เพื่อกัน token เก่า / user ถูกปิดใช้งาน
        const user = await prisma.user.findUnique({
            where: { id: payload.userId }
        });

        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // แนบข้อมูลที่จำเป็นไว้ใช้ทั้งระบบ
        req.user = {
            id: user.id,
            role: user.role,
            departmentId: user.departmentId
        };

        next();
    } catch (err) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
}

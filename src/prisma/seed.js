import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    const password = await bcrypt.hash('password123', 10);

    let dept = await prisma.department.findFirst({
        where: { name: 'Information Technology' }
    });

    if (!dept) {
        dept = await prisma.department.create({
            data: { name: 'Information Technology' }
        });
    }

    await prisma.user.upsert({
        where: { email: 'admin@test.com' },
        update: {},
        create: {
            email: 'admin@test.com',
            empId: 'ADM001',
            name: 'Admin',
            password: password,
            role: 'ADMIN',
            departmentId: dept.id
        }
    });

    await prisma.user.upsert({
        where: { email: 'eva@test.com' },
        update: {},
        create: {
            email: 'eva@test.com',
            empId: 'EVAL001',
            name: 'Evaluator',
            password: password,
            role: 'EVALUATOR',
            departmentId: dept.id
        }
    });

    await prisma.user.upsert({
        where: { email: 'tee@test.com' },
        update: {},
        create: {
            email: 'tee@test.com',
            empId: 'TEE001',
            name: 'Evaluatee',
            password: password,
            role: 'EVALUATEE',
            departmentId: dept.id
        }
    });
}

main()
    .then(() => prisma.$disconnect())
    .catch(e => {
        console.error(e);
        prisma.$disconnect();
    });

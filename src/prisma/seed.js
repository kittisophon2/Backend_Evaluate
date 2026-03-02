import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    const passwordHash = await bcrypt.hash('password123', 10);

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
        update: { passwordHash: passwordHash },
        create: {
            email: 'admin@test.com',
            name: 'Admin',
            passwordHash: passwordHash,
            role: 'ADMIN',
            departmentId: dept.id
        }
    });

    await prisma.user.upsert({
        where: { email: 'eva@test.com' },
        update: { passwordHash: passwordHash },
        create: {
            email: 'eva@test.com',
            name: 'Evaluator',
            passwordHash: passwordHash,
            role: 'EVALUATOR',
            departmentId: dept.id
        }
    });

    await prisma.user.upsert({
        where: { email: 'tee@test.com' },
        update: { passwordHash: passwordHash },
        create: {
            email: 'tee@test.com',
            name: 'Evaluatee',
            passwordHash: passwordHash,
            role: 'EVALUATEE',
            departmentId: dept.id
        }
    });

    let evaluation = await prisma.evaluation.findFirst({
        where: { name: 'Sample Evaluation' }
    });

    if (!evaluation) {
        evaluation = await prisma.evaluation.create({
            data: {
                name: 'Sample Evaluation',
                startAt: new Date(),
                endAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                status: 'OPEN',
                topics: {
                    create: [
                        {
                            name: 'Topic 1: Technical Skills',
                            indicators: {
                                create: [
                                    { name: 'Indicator 1.1: Code Quality', type: 'SCALE_1_4', weight: 0.5, requireEvidence: true },
                                    { name: 'Indicator 1.2: Problem Solving', type: 'SCALE_1_4', weight: 0.5, requireEvidence: false }
                                ]
                            }
                        },
                        {
                            name: 'Topic 2: Soft Skills',
                            indicators: {
                                create: [
                                    { name: 'Indicator 2.1: Communication', type: 'SCALE_1_4', weight: 0.5, requireEvidence: false },
                                    { name: 'Indicator 2.2: Teamwork', type: 'YES_NO', weight: 0.5, requireEvidence: false }
                                ]
                            }
                        }
                    ]
                }
            }
        });
        console.log('Created Evaluation with Topics and Indicators');
    } else {
        console.log('Sample Evaluation already exists');
    }
}

main()
    .then(() => prisma.$disconnect())
    .catch(e => {
        console.error(e);
        prisma.$disconnect();
    });

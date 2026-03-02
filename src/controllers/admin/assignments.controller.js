import prisma from '../../prisma/client.js';

//
// GET /admin/assignments
//
export const list = async (req, res, next) => {
    try {
        const {
            page = 1,
            pageSize = 10,
            periodId,
            departmentId,
            evaluatorId,
            evaluateeId,
            status
        } = req.query;

        const skip = (Number(page) - 1) * Number(pageSize);

        const where = {
            AND: [
                periodId ? { periodId } : {},
                departmentId ? { departmentId } : {},
                evaluatorId ? { evaluatorId } : {},
                evaluateeId ? { evaluateeId } : {},
                status ? { status } : {}
            ]
        };

        const [data, total] = await Promise.all([
            prisma.assignment.findMany({
                where,
                skip,
                take: Number(pageSize),
                orderBy: { createdAt: 'desc' }
            }),
            prisma.assignment.count({ where })
        ]);

        res.json({ data, meta: { total, page: Number(page), pageSize: Number(pageSize) } });
    } catch (err) {
        next(err);
    }
};

//
// POST /admin/assignments
// auto-create evaluation
//
export const create = async (req, res, next) => {
    try {
        // 1. เพิ่มการรับค่า name มาจาก req.body
        const { periodId, departmentId, evaluatorId, evaluateeId, name } = req.body;

        // 2. เช็คข้อมูลให้ครอบคลุมถึง name
        if (!periodId || !departmentId || !evaluatorId || !evaluateeId || !name) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // 3. ดึงข้อมูล Period เพื่อเอา startDate/endDate
        const period = await prisma.period.findUnique({ where: { id: periodId } });
        if (!period) {
            return res.status(404).json({ message: 'Period not found' });
        }

        // ใช้ transaction เพื่อสร้างข้อมูล
        const result = await prisma.$transaction(async (tx) => {

            // 4. สร้าง Evaluation ก่อน เพราะใน Schema Assignment อ้างอิงถึง Evaluation
            const evaluation = await tx.evaluation.create({
                data: {
                    name: name,
                    startDate: period.startDate || new Date(),
                    endDate: period.endDate || new Date(),
                    createdBy: req.user.id // ดึงจาก auth middleware
                }
            });

            // 5. สร้าง Assignment โดยเชื่อมกับ evaluation.id ที่เพิ่งสร้าง
            const assignment = await tx.assignment.create({
                data: {
                    periodId,
                    departmentId,
                    evaluatorId,
                    evaluateeId,
                    evaluationId: evaluation.id
                }
            });

            return { assignment, evaluation };
        });

        res.status(201).json(result);
    } catch (err) {
        // duplicate assignment
        if (err.code === 'P2002') {
            return res.status(409).json({ message: 'Duplicate assignment' });
        }
        next(err);
    }
};

//
// PATCH /admin/assignments/:id
//
export const update = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { status } = req.body;

        const assignment = await prisma.assignment.findUnique({ where: { id } });
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        const updated = await prisma.assignment.update({
            where: { id },
            data: { status }
        });

        res.json(updated);
    } catch (err) {
        next(err);
    }
};

//
// DELETE /admin/assignments/:id
//
export const remove = async (req, res, next) => {
    try {
        const id = req.params.id;

        const assignment = await prisma.assignment.findUnique({ where: { id } });
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        await prisma.assignment.delete({ where: { id } });
        res.status(204).end();
    } catch (err) {
        next(err);
    }
};

import prisma from '../../prisma/client.js';

//
// GET /admin/assignments
//
export const list = async (req, res, next) => {
    try {
        const {
            page = 1,
            pageSize = 10,
            evaluationId,
            evaluatorId,
            evaluateeId
        } = req.query;

        const skip = (Number(page) - 1) * Number(pageSize);

        const where = {
            AND: [
                evaluationId ? { evaluationId } : {},
                evaluatorId ? { evaluatorId } : {},
                evaluateeId ? { evaluateeId } : {}
            ]
        };

        const [data, total] = await Promise.all([
            prisma.assignment.findMany({
                where,
                skip,
                take: Number(pageSize),
                include: {
                    evaluation: { select: { name: true } },
                    evaluator: { select: { name: true, email: true } },
                    evaluatee: { select: { name: true, email: true } }
                }
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
        const { evaluationId, evaluatorId, evaluateeId } = req.body;

        if (!evaluationId || !evaluatorId || !evaluateeId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const evaluation = await prisma.evaluation.findUnique({ where: { id: evaluationId } });
        if (!evaluation) {
            return res.status(404).json({ message: 'Evaluation not found' });
        }

        const assignment = await prisma.assignment.create({
            data: {
                evaluationId,
                evaluatorId,
                evaluateeId
            }
        });

        res.status(201).json(assignment);
    } catch (err) {
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
        const { evaluatorId, evaluateeId } = req.body;

        const assignment = await prisma.assignment.findUnique({ where: { id } });
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        const updated = await prisma.assignment.update({
            where: { id },
            data: {
                evaluatorId: evaluatorId || undefined,
                evaluateeId: evaluateeId || undefined
            }
        });

        res.json(updated);
    } catch (err) {
        if (err.code === 'P2002') {
            return res.status(409).json({ message: 'Duplicate assignment' });
        }
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

import prisma from '../../prisma/client.js';

//
// GET /admin/periods
//
export const list = async (req, res, next) => {
    try {
        const { q = '', page = 1, pageSize = 10, sort = 'startAt:desc', status } = req.query;
        const [sortField, sortOrder] = sort.split(':');
        const skip = (Number(page) - 1) * Number(pageSize);

        const where = {
            AND: [
                q ? { name: { contains: q } } : {},
                status ? { status } : {}
            ]
        };

        const [data, total] = await Promise.all([
            prisma.evaluation.findMany({
                where,
                skip,
                take: Number(pageSize),
                orderBy: { [sortField]: sortOrder }
            }),
            prisma.evaluation.count({ where })
        ]);

        res.json({ data, meta: { total, page: Number(page), pageSize: Number(pageSize) } });
    } catch (err) {
        next(err);
    }
};

//
// POST /admin/periods
//
export const create = async (req, res, next) => {
    try {
        const { name, startAt, endAt, status = 'DRAFT' } = req.body;
        if (!name || !startAt || !endAt) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const evaluation = await prisma.evaluation.create({
            data: {
                name,
                startAt: new Date(startAt),
                endAt: new Date(endAt),
                status
            }
        });

        res.status(201).json(evaluation);
    } catch (err) {
        next(err);
    }
};

//
// PATCH /admin/periods/:id
//
export const update = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { name, startAt, endAt, status } = req.body;

        const evaluation = await prisma.evaluation.findUnique({ where: { id } });
        if (!evaluation) return res.status(404).json({ message: 'Evaluation not found' });

        const updated = await prisma.evaluation.update({
            where: { id },
            data: {
                name,
                startAt: startAt ? new Date(startAt) : undefined,
                endAt: endAt ? new Date(endAt) : undefined,
                status
            }
        });

        res.json(updated);
    } catch (err) {
        next(err);
    }
};

//
// PATCH /admin/periods/:id/close
//
export const close = async (req, res, next) => {
    try {
        const id = req.params.id;

        const evaluation = await prisma.evaluation.findUnique({ where: { id } });
        if (!evaluation) return res.status(404).json({ message: 'Evaluation not found' });

        if (evaluation.status === 'CLOSED') {
            return res.status(400).json({ message: 'Evaluation already closed' });
        }

        await prisma.evaluation.update({
            where: { id },
            data: { status: 'CLOSED' }
        });

        res.json({ message: 'Evaluation period closed successfully' });
    } catch (err) {
        next(err);
    }
};

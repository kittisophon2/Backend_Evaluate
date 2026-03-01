import prisma from '../../prisma/client.js';

//
// GET /admin/periods
//
export const list = async (req, res, next) => {
    try {
        const { q = '', page = 1, pageSize = 10, sort = 'startDate:desc', status } = req.query;
        const [sortField, sortOrder] = sort.split(':');
        const skip = (Number(page) - 1) * Number(pageSize);

        const where = {
            AND: [
                q ? { name: { contains: q } } : {},
                status ? { status } : {}
            ]
        };

        const [data, total] = await Promise.all([
            prisma.period.findMany({
                where,
                skip,
                take: Number(pageSize),
                orderBy: { [sortField]: sortOrder }
            }),
            prisma.period.count({ where })
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
        const { name, startDate, endDate } = req.body;
        if (!name || !startDate || !endDate) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const period = await prisma.period.create({
            data: {
                name,
                startDate: new Date(startDate),
                endDate: new Date(endDate)
            }
        });

        res.status(201).json(period);
    } catch (err) {
        next(err);
    }
};

//
// PATCH /admin/periods/:id
//
export const update = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const { name, startDate, endDate, status } = req.body;

        const period = await prisma.period.findUnique({ where: { id } });
        if (!period) return res.status(404).json({ message: 'Period not found' });

        const updated = await prisma.period.update({
            where: { id },
            data: {
                name,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
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
        const id = Number(req.params.id);

        const period = await prisma.period.findUnique({ where: { id } });
        if (!period) return res.status(404).json({ message: 'Period not found' });

        if (period.status === 'CLOSED') {
            return res.status(400).json({ message: 'Period already closed' });
        }

        await prisma.$transaction([
            prisma.period.update({
                where: { id },
                data: { status: 'CLOSED' }
            }),
            prisma.evaluation.updateMany({
                where: { periodId: id },
                data: { status: 'LOCKED', lockedAt: new Date() }
            })
        ]);

        res.json({ message: 'Period closed and evaluations locked' });
    } catch (err) {
        next(err);
    }
};

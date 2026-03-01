import prisma from '../../prisma/client.js';

//
// GET /admin/topics/:topicId/indicators
//
export const list = async (req, res, next) => {
    try {
        const topicId = Number(req.params.topicId);
        const {
            q = '',
            page = 1,
            pageSize = 10,
            sort = 'createdAt:asc',
            isActive
        } = req.query;

        const [sortField, sortOrder] = sort.split(':');
        const skip = (Number(page) - 1) * Number(pageSize);

        const where = {
            AND: [
                { topicId },
                q
                    ? {
                        OR: [
                            { title: { contains: q } },
                            { code: { contains: q } }
                        ]
                    }
                    : {},
                isActive !== undefined ? { isActive: isActive === 'true' } : {}
            ]
        };

        const [data, total] = await Promise.all([
            prisma.indicator.findMany({
                where,
                skip,
                take: Number(pageSize),
                orderBy: { [sortField]: sortOrder }
            }),
            prisma.indicator.count({ where })
        ]);

        res.json({
            data,
            meta: { total, page: Number(page), pageSize: Number(pageSize) }
        });
    } catch (err) {
        next(err);
    }
};

//
// POST /admin/topics/:topicId/indicators
//
export const create = async (req, res, next) => {
    try {
        const topicId = Number(req.params.topicId);
        const {
            code,
            title,
            type,
            weight,
            evidenceRequiredWhenYes = false,
            isActive = true
        } = req.body;

        if (!code || !title || !type || weight === undefined) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const exists = await prisma.indicator.findFirst({
            where: { topicId, code }
        });

        if (exists) {
            return res.status(409).json({ message: 'Indicator code already exists in this topic' });
        }

        const indicator = await prisma.indicator.create({
            data: {
                topicId,
                code,
                title,
                type,
                weight: Number(weight),
                evidenceRequiredWhenYes,
                isActive
            }
        });

        res.status(201).json(indicator);
    } catch (err) {
        next(err);
    }
};

//
// PATCH /admin/topics/:topicId/indicators/:indicatorId
//
export const update = async (req, res, next) => {
    try {
        const indicatorId = Number(req.params.indicatorId);
        const {
            title,
            type,
            weight,
            evidenceRequiredWhenYes,
            isActive
        } = req.body;

        const indicator = await prisma.indicator.findUnique({
            where: { id: indicatorId }
        });

        if (!indicator) {
            return res.status(404).json({ message: 'Indicator not found' });
        }

        const updated = await prisma.indicator.update({
            where: { id: indicatorId },
            data: {
                title,
                type,
                weight: weight !== undefined ? Number(weight) : undefined,
                evidenceRequiredWhenYes,
                isActive
            }
        });

        res.json(updated);
    } catch (err) {
        next(err);
    }
};

//
// DELETE /admin/topics/:topicId/indicators/:indicatorId
//
export const remove = async (req, res, next) => {
    try {
        const indicatorId = Number(req.params.indicatorId);

        const indicator = await prisma.indicator.findUnique({
            where: { id: indicatorId }
        });

        if (!indicator) {
            return res.status(404).json({ message: 'Indicator not found' });
        }

        await prisma.indicator.update({
            where: { id: indicatorId },
            data: { isActive: false }
        });

        res.status(204).end();
    } catch (err) {
        next(err);
    }
};

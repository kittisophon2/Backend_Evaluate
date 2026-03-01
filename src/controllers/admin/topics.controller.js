import prisma from '../../prisma/client.js';

//
// GET /admin/topics
//
export const list = async (req, res, next) => {
    try {
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
                q
                    ? {
                        OR: [
                            { name: { contains: q } },
                            { code: { contains: q } }
                        ]
                    }
                    : {},
                isActive !== undefined ? { isActive: isActive === 'true' } : {}
            ]
        };

        const [data, total] = await Promise.all([
            prisma.topic.findMany({
                where,
                skip,
                take: Number(pageSize),
                orderBy: { [sortField]: sortOrder }
            }),
            prisma.topic.count({ where })
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
// POST /admin/topics
//
export const create = async (req, res, next) => {
    try {
        const { code, name, weight, isActive = true } = req.body;

        if (!code || !name || weight === undefined) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const exists = await prisma.topic.findUnique({ where: { code } });
        if (exists) {
            return res.status(409).json({ message: 'Topic code already exists' });
        }

        const topic = await prisma.topic.create({
            data: { code, name, weight: Number(weight), isActive }
        });

        res.status(201).json(topic);
    } catch (err) {
        next(err);
    }
};

//
// PATCH /admin/topics/:id
//
export const update = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const { name, weight, isActive } = req.body;

        const topic = await prisma.topic.findUnique({ where: { id } });
        if (!topic) {
            return res.status(404).json({ message: 'Topic not found' });
        }

        const updated = await prisma.topic.update({
            where: { id },
            data: {
                name,
                weight: weight !== undefined ? Number(weight) : undefined,
                isActive
            }
        });

        res.json(updated);
    } catch (err) {
        next(err);
    }
};

//
// DELETE /admin/topics/:id
//
export const remove = async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        const topic = await prisma.topic.findUnique({ where: { id } });
        if (!topic) {
            return res.status(404).json({ message: 'Topic not found' });
        }

        await prisma.topic.update({
            where: { id },
            data: { isActive: false }
        });

        res.status(204).end();
    } catch (err) {
        next(err);
    }
};

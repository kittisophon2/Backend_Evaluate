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
            evaluationId
        } = req.query;

        const [sortField, sortOrder] = sort.split(':');
        const skip = (Number(page) - 1) * Number(pageSize);

        const where = {
            AND: [
                q ? { name: { contains: q } } : {},
                evaluationId ? { evaluationId } : {}
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
        const { evaluationId, name, description } = req.body;

        if (!evaluationId || !name || !description) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const evaluation = await prisma.evaluation.findUnique({ where: { id: evaluationId } });
        if (!evaluation) {
            return res.status(404).json({ message: 'Evaluation not found' });
        }

        const topic = await prisma.topic.create({
            data: {
                evaluationId,
                name,
                description,
                createdBy: req.user.id
            }
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
        const id = req.params.id;
        const { name, description } = req.body;

        const topic = await prisma.topic.findUnique({ where: { id } });
        if (!topic) {
            return res.status(404).json({ message: 'Topic not found' });
        }

        const updated = await prisma.topic.update({
            where: { id },
            data: {
                name,
                description
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
        const id = req.params.id;

        const topic = await prisma.topic.findUnique({ where: { id } });
        if (!topic) {
            return res.status(404).json({ message: 'Topic not found' });
        }

        await prisma.topic.delete({
            where: { id }
        });

        res.status(204).end();
    } catch (err) {
        next(err);
    }
};

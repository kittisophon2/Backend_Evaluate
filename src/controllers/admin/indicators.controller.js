import prisma from '../../prisma/client.js';

//
// GET /admin/indicators
//
export const listAll = async (req, res, next) => {
    try {
        const {
            q = '',
            page = 1,
            pageSize = 10,
            sort = 'name:asc',
            topicId
        } = req.query;

        const [sortField, sortOrder] = sort.split(':');
        const skip = (Number(page) - 1) * Number(pageSize);

        const where = {
            AND: [
                q ? { name: { contains: q } } : {},
                topicId ? { topicId } : {}
            ]
        };

        const [data, total] = await Promise.all([
            prisma.indicator.findMany({
                where,
                skip,
                take: Number(pageSize),
                orderBy: { [sortField]: sortOrder },
                include: {
                    topic: {
                        select: { name: true }
                    }
                }
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
// GET /admin/topics/:topicId/indicators
//
export const list = async (req, res, next) => {
    try {
        const topicId = req.params.topicId;
        const {
            q = '',
            page = 1,
            pageSize = 10,
            sort = 'name:asc'
        } = req.query;

        const [sortField, sortOrder] = sort.split(':');
        const skip = (Number(page) - 1) * Number(pageSize);

        const where = {
            AND: [
                { topicId },
                q ? { name: { contains: q } } : {}
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
        const topicId = req.params.topicId;
        const {
            name,
            type,
            indicatorType,
            requireEvidence = false,
            weight
        } = req.body;

        const resolvedType = type || indicatorType;

        if (!name || !resolvedType || weight === undefined) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const topicExists = await prisma.topic.findUnique({
            where: { id: topicId }
        });

        if (!topicExists) {
            return res.status(404).json({ message: 'Topic not found' });
        }

        const indicator = await prisma.indicator.create({
            data: {
                topicId,
                name,
                type: resolvedType,
                requireEvidence,
                weight: Number(weight)
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
        const indicatorId = req.params.indicatorId;
        const {
            name,
            type,
            indicatorType,
            requireEvidence,
            weight
        } = req.body;

        const indicator = await prisma.indicator.findUnique({
            where: { id: indicatorId }
        });

        if (!indicator) {
            return res.status(404).json({ message: 'Indicator not found' });
        }

        const resolvedType = type || indicatorType;

        const updated = await prisma.indicator.update({
            where: { id: indicatorId },
            data: {
                name,
                type: resolvedType,
                requireEvidence,
                weight: weight !== undefined ? Number(weight) : undefined
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
        const indicatorId = req.params.indicatorId;

        const indicator = await prisma.indicator.findUnique({
            where: { id: indicatorId }
        });

        if (!indicator) {
            return res.status(404).json({ message: 'Indicator not found' });
        }

        await prisma.indicator.delete({
            where: { id: indicatorId }
        });

        res.status(204).end();
    } catch (err) {
        next(err);
    }
};

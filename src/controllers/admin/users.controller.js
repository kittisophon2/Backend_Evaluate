import prisma from '../../prisma/client.js';
import bcrypt from 'bcrypt';

//
// GET /admin/users
// list + search + pagination + sort
//
export const list = async (req, res, next) => {
    try {
        const {
            q = '',
            page = 1,
            pageSize = 10,
            sort = 'createdAt:desc',
            role,
            departmentId
        } = req.query;

        const [sortField, sortOrder] = sort.split(':');

        const where = {
            AND: [
                q
                    ? {
                        OR: [
                            { name: { contains: q } },
                            { email: { contains: q } }
                        ]
                    }
                    : {},
                role ? { role } : {},
                departmentId ? { departmentId } : {}
            ]
        };

        const skip = (Number(page) - 1) * Number(pageSize);

        const [data, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: Number(pageSize),
                orderBy: { [sortField]: sortOrder },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    departmentId: true,
                    createdAt: true
                }
            }),
            prisma.user.count({ where })
        ]);

        res.json({
            data,
            meta: {
                total,
                page: Number(page),
                pageSize: Number(pageSize)
            }
        });
    } catch (err) {
        next(err);
    }
};

//
// POST /admin/users
// create user
//
export const create = async (req, res, next) => {
    try {
        const { email, name, password, role, departmentId } = req.body;

        if (!email || !name || !password || !role) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const exists = await prisma.user.findUnique({ where: { email } });
        if (exists) {
            return res.status(409).json({ message: 'Email already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                name,
                passwordHash,
                role,
                departmentId: departmentId || null
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                departmentId: true,
                createdAt: true
            }
        });

        res.status(201).json(user);
    } catch (err) {
        next(err);
    }
};

//
// GET /admin/users/:id
//
export const get = async (req, res, next) => {
    try {
        const id = req.params.id;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                departmentId: true,
                createdAt: true
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        next(err);
    }
};

//
// PATCH /admin/users/:id
// update user (no password here)
//
export const update = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { name, role, departmentId } = req.body;

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const updated = await prisma.user.update({
            where: { id },
            data: {
                name,
                role,
                departmentId: departmentId !== undefined ? departmentId : undefined
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                departmentId: true,
                createdAt: true // Schema doesn't have updatedAt
            }
        });

        res.json(updated);
    } catch (err) {
        next(err);
    }
};

//
// DELETE /admin/users/:id
// hard delete since isActive is gone
//
export const remove = async (req, res, next) => {
    try {
        const id = req.params.id;

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await prisma.user.delete({
            where: { id }
        });

        res.status(204).end();
    } catch (err) {
        next(err);
    }
};

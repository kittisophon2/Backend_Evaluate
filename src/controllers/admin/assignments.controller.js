export const list = (req,res) => res.json({}); export const create = (req,res) => res.json({}); export const update = (req,res) => res.json({}); export const remove = (req,res) => res.json({});import prisma from '../../prisma/client.js';

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
        periodId ? { periodId: Number(periodId) } : {},
        departmentId ? { departmentId: Number(departmentId) } : {},
        evaluatorId ? { evaluatorId: Number(evaluatorId) } : {},
        evaluateeId ? { evaluateeId: Number(evaluateeId) } : {},
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
    const { periodId, departmentId, evaluatorId, evaluateeId } = req.body;

    if (!periodId || !departmentId || !evaluatorId || !evaluateeId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // ใช้ transaction เพื่อกันข้อมูลครึ่ง ๆ กลาง ๆ
    const result = await prisma.$transaction(async (tx) => {
      // Prisma จะ throw error ถ้า duplicate (เพราะ @@unique)
      const assignment = await tx.assignment.create({
        data: {
          periodId: Number(periodId),
          departmentId: Number(departmentId),
          evaluatorId: Number(evaluatorId),
          evaluateeId: Number(evaluateeId)
        }
      });

      const evaluation = await tx.evaluation.create({
        data: {
          assignmentId: assignment.id,
          periodId: assignment.periodId,
          evaluatorId: assignment.evaluatorId,
          evaluateeId: assignment.evaluateeId,
          departmentId: assignment.departmentId
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
    const id = Number(req.params.id);
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
    const id = Number(req.params.id);

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

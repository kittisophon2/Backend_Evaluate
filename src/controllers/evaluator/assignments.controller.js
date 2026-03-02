import prisma from '../../prisma/client.js';

//
// GET /evaluator/assignments
//
export const list = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      periodId,
      status
    } = req.query;

    const skip = (Number(page) - 1) * Number(pageSize);

    const where = {
      evaluatorId: req.user.id,
      ...(periodId ? { periodId: Number(periodId) } : {}),
      ...(status ? { status } : {})
    };

    const [data, total] = await Promise.all([
      prisma.assignment.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          period: true,
          evaluatee: {
            select: { id: true, name: true }
          },
          evaluation: {
            select: { id: true, status: true }
          }
        }
      }),
      prisma.assignment.count({ where })
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
// GET /evaluator/assignments/:id
//
export const detail = async (req, res, next) => {
  try {
    const assignmentId = Number(req.params.id);

    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        evaluatorId: req.user.id
      },
      include: {
        period: true,
        evaluatee: {
          select: { id: true, name: true }
        },
        evaluation: {
          include: {
            results: true
          }
        }
      }
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // โหลด template indicators
    const topics = await prisma.topic.findMany({
      where: { isActive: true },
      include: {
        indicators: {
          where: { isActive: true }
        }
      }
    });

    res.json({ assignment, topics });
  } catch (err) {
    next(err);
  }
};

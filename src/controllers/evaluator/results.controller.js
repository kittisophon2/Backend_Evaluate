import prisma from '../../prisma/client.js';

//
// PUT /evaluator/assignments/:id/results
//
export const save = async (req, res, next) => {
    try {
        const assignmentId = req.params.id;
        const { items } = req.body;

        if (!Array.isArray(items)) {
            return res.status(400).json({ message: 'Items must be an array' });
        }

        // ตรวจสอบ assignment + evaluation
        const assignment = await prisma.assignment.findFirst({
            where: {
                id: assignmentId,
                evaluatorId: req.user.id
            },
            include: { evaluation: true }
        });

        if (!assignment || !assignment.evaluation) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // ถ้าไม่ใช่ DRAFT ไม่ให้แก้
        if (assignment.evaluation.status !== 'DRAFT') {
            return res.status(409).json({ message: 'Evaluation already submitted' });
        }

        // บันทึกผลแต่ละ indicator โดยอิงตาม Schema ของ IndicatorResult
        // Schema รับแค่: indicatorId, assignmentId, score
        await prisma.$transaction(async (tx) => {
            for (const item of items) {
                const { indicatorId, score } = item;

                const existingResult = await tx.indicatorResult.findFirst({
                    where: {
                        assignmentId,
                        indicatorId
                    }
                });

                if (existingResult) {
                    await tx.indicatorResult.update({
                        where: { id: existingResult.id },
                        data: { score: Number(score) }
                    });
                } else {
                    await tx.indicatorResult.create({
                        data: {
                            assignmentId,
                            indicatorId,
                            score: Number(score)
                        }
                    });
                }
            }
        });

        res.json({ message: 'Results saved' });
    } catch (err) {
        next(err);
    }
};

//
// PATCH /evaluator/assignments/:id/submit
//
export const submit = async (req, res, next) => {
    try {
        const assignmentId = req.params.id;

        const assignment = await prisma.assignment.findFirst({
            where: {
                id: assignmentId,
                evaluatorId: req.user.id
            },
            include: { evaluation: true }
        });

        if (!assignment || !assignment.evaluation) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        if (assignment.evaluation.status !== 'DRAFT') {
            return res.status(400).json({ message: 'Evaluation is not in DRAFT status' });
        }

        await prisma.$transaction([
            prisma.evaluation.update({
                where: { id: assignment.evaluation.id },
                data: { status: 'SUBMITTED' } /* หรือ COMPLETED ตาม Design ของระบบ */
            }),
            prisma.assignment.update({
                where: { id: assignment.id },
                data: { status: 'COMPLETED' }
            })
        ]);

        res.json({ message: 'Evaluation submitted successfully' });
    } catch (err) {
        next(err);
    }
};

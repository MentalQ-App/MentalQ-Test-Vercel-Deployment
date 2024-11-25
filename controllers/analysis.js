const db = require('../models');
require('dotenv').config();

exports.getAnalysis = async (req, res) => {
    const user_id = req.user_id;
    let t;

    try {
        t = await db.sequelize.transaction();

        const notes = await db.Notes.findAll(
            { 
                where: { 
                    user_id,
                    isActive: true
                },
                include: "analysis",
                transaction: t 
            }
        ); 

        await t.commit();

        const analyses = notes.map(note => note.analysis).filter(analysis => analysis != null);

        res.status(200).json({
            error: false,
            message: 'Analyses retrieved successfully',
            listAnalysis: analyses
        });
    }
    catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ 
            error: true, 
            message: error.message 
        });
    }
}
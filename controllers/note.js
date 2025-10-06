const db = require('../models');
const { Notes, Users, Analysis } = db;
require('dotenv').config();
const axios = require('axios');

exports.createNote = async (req, res) => {
    const { title, content, emotion } = req.body;
    const user_id = req.user_id;
    let t;

    try {
        t = await db.sequelize.transaction();

        const user = await Users.findByPk(user_id, { transaction: t });

        if (!user) {
            await t.rollback();
            return res.status(404).json({
                error: true,
                message: "User not found",
            });
        }

        const todayDate = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Jakarta",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).format(new Date());

        const existingNote = await Notes.findOne({
            where: {
                user_id,
                isActive: true,
                createdAt: {
                    [db.Sequelize.Op.gte]: db.sequelize.literal(
                        `DATE('${todayDate}')`
                    ),
                    [db.Sequelize.Op.lt]: db.sequelize.literal(
                        `DATE('${todayDate}') + INTERVAL 1 DAY`
                    ),
                },
            },
            transaction: t,
        });

        if (existingNote) {
            await t.rollback();
            return res.status(400).json({
                error: true,
                message: "You have already created a note today",
            });
        }

        const newNote = await Notes.create(
            {
                user_id,
                title,
                content,
                emotion,
            },
            { transaction: t }
        );

        await t.commit();

        res.status(201).json({
            error: false,
            message: "Note created successfully",
            note: newNote,
        });
    } catch (error) {
        if (t) await t.rollback();
        res.status(400).json({
            error: true,
            message: error.message,
        });
    }
};

exports.getAllNotes = async (req, res) => {
    const user_id = req.user_id;
    let t;

    try {
        t = await db.sequelize.transaction();

        const user = await Users.findByPk(user_id, { transaction: t });

        if (!user) {
            await t.rollback();
            return res.status(404).json({
                error: true,
                message: 'User not found'
            });
        }

        const notes = await Notes.findAll({
            where: {
                user_id,
                isActive: true,
            },
            include: [
                {
                    model: Analysis,
                    as: "analysis",
                    attributes: ["predicted_status", "confidence_score"],
                },
            ],
            transaction: t,
        });

        const notesWithAnalysis = notes.map((note) => {
            const analysis = note.analysis || {};

            const noteData = note.toJSON();
            delete noteData.analysis;

            return {
                ...noteData,
                predicted_status: analysis.predicted_status,
                confidence_score: analysis.confidence_score,
            };
        });

        await t.commit();

        res.status(200).json({
            error: false,
            message: "Notes retrieved successfully",
            listNote: notesWithAnalysis,
        });
    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({
            error: true,
            message: error.message,
        });
    }
};

exports.getNoteById = async (req, res) => {
    const { id } = req.params;
    const user_id = req.user_id;
    let t;

    try {
        t = await db.sequelize.transaction();

        const note = await Notes.findOne({
            where: {
                note_id: id,
                user_id,
                isActive: true
            },
            transaction: t
        });

        if (!note) {
            await t.rollback();
            return res.status(404).json({
                error: true,
                message: 'Note not found'
            });
        }

        await t.commit();
        res.status(200).json({
            error: false,
            message: 'Note retrieved successfully',
            note
        });
    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({
            error: true,
            message: error.message
        });
    }
};

exports.updateNote = async (req, res) => {
    const { id } = req.params;
    const { title, content, emotion, content_normalized} = req.body;
    const user_id = req.user_id;
    let t;

    try {
        t = await db.sequelize.transaction();

        const note = await Notes.findOne({
            where: {
                note_id: id,
                user_id,
                isActive: true
            },
            transaction: t
        });

        if (!note) {
            await t.rollback();
            return res.status(404).json({
                error: true,
                message: 'Note not found'
            });
        }

        const initialContent = note.content;

        const updatedNote = await note.update(
            {
                title: title || note.title,
                content: content || note.content,
                emotion: emotion || note.emotion,
                content_normalized: content_normalized || note.content_normalized,
            },
            { transaction: t }
        );

        await t.commit();

        if (content != initialContent) {
            analyzeNotes(user_id);
        }

        res.status(200).json({
            error: false,
            message: 'Note updated successfully',
            note: updatedNote
        });
    } catch (error) {
        if (t) await t.rollback();
        res.status(400).json({
            error: true,
            message: error.message
        });
    }
};

exports.deleteNote = async (req, res) => {
    const { id } = req.params;
    const user_id = req.user_id;
    let t;

    try {
        t = await db.sequelize.transaction();

        const note = await Notes.findOne({
            where: {
                note_id: id,
                user_id,
                isActive: true,
            },
            transaction: t,
        });

        if (!note) {
            await t.rollback();
            return res.status(404).json({
                error: true,
                message: "Note not found",
            });
        }

        await note.update(
            {
                isActive: false,
            },
            { transaction: t }
        );

        await t.commit();

        res.status(200).json({
            error: false,
            message: "Note deleted successfully",
        });
    } catch (error) {
        if (t) await t.rollback();
        res.status(400).json({
            error: true,
            message: error.message,
        });
    }
};

const analyzeNotes = async (user_id) => {
    try {
        const dailyNotes = await Notes.findAll({
            where: {
                user_id,
                isActive: true,
                updatedAt: {
                    [db.Sequelize.Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)),
                },
            },
            order: [["updatedAt", "DESC"]],
            limit: 1,
        });

        if (dailyNotes.length === 0) {
            console.log("No daily notes found for analysis");
            return null;
        }

        const content = dailyNotes
            .map((note) => note.content_normalized || note.content)
            .join(" ");

        const aiResponse = await axios.post(
            process.env.CLOUDRUNAPI + "/predict",
            { statements: [content] },
            {
                headers: { "Content-Type": "application/json" },
            }
        );

        const { predicted_status, confidence_scores } = aiResponse.data[0];

        const highest_confidence_score = Math.max(
            ...Object.values(confidence_scores)
        );

        const findNoteById = await Analysis.findOne({
            where: {
                note_id: dailyNotes[0].note_id,
            },
        });

        if (findNoteById) {
            const updatedAnalysis = await findNoteById.update({
                predicted_status: predicted_status,
                confidence_score: highest_confidence_score,
            });
            console.log("Analysis updated successfully:", updatedAnalysis);
            return updatedAnalysis;
        } else {
            const newAnalysis = await Analysis.create({
                note_id: dailyNotes[0].note_id,
                predicted_status: predicted_status,
                confidence_score: highest_confidence_score,
            });
            console.log("Analysis completed successfully:", newAnalysis);
            return newAnalysis;
        }
    } catch (error) {
        console.error("Error analyzing notes:", error.message);
        console.error(error.stack);
        return null;
    }
};

// exports.analyzeDailyNotes = async (req, res) => {
//     const user_id = req.user_id;

//     try {
//         // Fetch user's daily notes
//         const dailyNotes = await Notes.findAll({
//             where: {
//                 user_id,
//                 isActive: true,
//                 createdAt: {
//                     [db.Sequelize.Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)),
//                 },
//             },
//         });

//         if (dailyNotes.length === 0) {
//             return res.status(404).json({
//                 error: true,
//                 message: 'No daily notes found for analysis',
//             });
//         }

//         // Prepare the notes content for AI analysis
//         const content = dailyNotes.map((note) => note.content).join(' ');

//         // Make the AI service call
//         const aiResponse = await axios.post(
//             process.env.CLOUDRUNAPI + '/predict',
//             { content },
//             {
//                 headers: { 'Content-Type': 'application/json' },
//             }
//         );

//         // Handle AI service response
//         const { predicted_status } = aiResponse.data;

//         // Save analysis results to the database
//         const newAnalysis = await Analysis.create({
//             entry_id: dailyNotes[0].entry_id, // Assuming linking with the first note of the day
//             predicted_status,
//             analysis_date: new Date(),
//         });

//         res.status(200).json({
//             error: false,
//             message: 'Analysis completed successfully',
//             analysis: newAnalysis,
//         });
//     } catch (error) {
//         console.error(error);

//         // Handle errors gracefully
//         res.status(500).json({
//             error: true,
//             message: error.response?.data?.message || error.message,
//         });
//     }
// };
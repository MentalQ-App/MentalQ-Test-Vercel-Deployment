const db = require('../models');
const { Notes, Users, Analysis } = db;

exports.createNote = async (req, res) => {
    const { title, content, emotion } = req.body;
    const user_id = req.user_id;
    let t;

    try {
        // if (!title || !content || !emotion) {
        //     return res.status(400).json({ 
        //         error: true, 
        //         message: 'All fields are required' 
        //     });
        // }

        t = await db.sequelize.transaction();

        const user = await Users.findByPk(user_id, { transaction: t });
        
        if (!user) {
            await t.rollback();
            return res.status(404).json({ 
                error: true, 
                message: 'User not found' 
            });
        }

        const newNote = await Notes.create(
            { 
                user_id, 
                title, 
                content, 
                emotion 
            }, 
            { transaction: t }
        );

        await t.commit();

        res.status(201).json({
            error: false,
            message: 'Note created successfully',
            note: newNote
        });
    } catch (error) {
        if (t) await t.rollback();
        res.status(400).json({ 
            error: true, 
            message: error.message 
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
                isActive: true 
            },
            transaction: t 
        });

        await t.commit();

        res.status(200).json({
            error: false,
            message: 'Notes retrieved successfully',
            listNote: notes
        });
    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ 
            error: true, 
            message: error.message 
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
    const { title, content, emotion } = req.body;
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

        const updatedNote = await note.update({
            title: title || note.title,
            content: content || note.content,
            emotion: emotion || note.emotion
        }, { transaction: t });

        await t.commit();

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

        await note.update({ 
            isActive: false 
        }, { transaction: t });

        await t.commit();

        res.status(200).json({ 
            error: false,
            message: 'Note deleted successfully' 
        });
    } catch (error) {
        if (t) await t.rollback();
        res.status(400).json({ 
            error: true, 
            message: error.message 
        });
    }
};

exports.analyzeDailyNotes = async (req, res) => {
    const user_id = req.user_id;

    try {
        // Fetch user's daily notes
        const dailyNotes = await Notes.findAll({
            where: {
                user_id,
                isActive: true,
                createdAt: {
                    [db.Sequelize.Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)),
                },
            },
        });

        if (dailyNotes.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'No daily notes found for analysis',
            });
        }

        // Prepare the notes content for AI analysis
        const content = dailyNotes.map((note) => note.content).join(' ');

        // Make the AI service call
        const aiResponse = await axios.post(
            'https://<cloud-run-url>/analyze',
            { content },
            {
                headers: { 'Content-Type': 'application/json' },
            }
        );

        // Handle AI service response
        const { predicted_status } = aiResponse.data;

        // Save analysis results to the database
        const newAnalysis = await Analysis.create({
            entry_id: dailyNotes[0].entry_id, // Assuming linking with the first note of the day
            predicted_status,
            analysis_date: new Date(),
        });

        res.status(200).json({
            error: false,
            message: 'Analysis completed successfully',
            analysis: newAnalysis,
        });
    } catch (error) {
        console.error(error);

        // Handle errors gracefully
        res.status(500).json({
            error: true,
            message: error.response?.data?.message || error.message,
        });
    }
};
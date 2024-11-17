// controller/note.js
const Note = require('../models/notes');
const User = require('../models/users');

// Create a new note
exports.createNote = async (req, res) => {
    const { title, content, emotion } = req.body;
    const user_id = req.user_id;
    try {
        const user = await User.findByPk(user_id);
        if (user) {
            const newNote = await Note.create({ user_id, title, content, emotion });
            res.status(201).json({
                error: false,
                message: 'Note created successfully',
                note: newNote
            });
        } else {
            res.status(404).json({ error: true, message: 'User not found' });
        }
    } catch (error) {
        res.status(400).json({ error: true, message: error.message });
    }
};

// Get all notes for a specific user
exports.getAllNotes = async (req, res) => {
    const user_id = req.user_id;
    try {
        const user = await User.findByPk(user_id);
        if (user) {
            const notes = await Note.findAll({ where: { user_id } });
            res.status(200).json({
                error: false,
                message: 'Notes retrieved successfully',
                listNote: notes
            });
        } else {
            res.status(404).json({ error: true, message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ error: true, message: error.message });
    }
};

// Get a specific note by ID
exports.getNoteById = async (req, res) => {
    const { id } = req.params;
    try {
        const note = await Note.findByPk(id);
        if (note) {
            res.json(note);
        } else {
            res.status(404).json({ error: true, message: 'Note not found' });
        }
    } catch (error) {
        res.status(500).json({ error: true, message: error.message });
    }
};

// Update a note by ID
exports.updateNote = async (req, res) => {
    const { id } = req.params;
    const { title, content, emotion } = req.body;
    try {
        const note = await Note.findByPk(note_id = id);
        if (note) {
            note.title = title ?? note.title;
            note.content = content ?? note.content;
            note.emotion = emotion ?? note.emotion;
            await note.save();
            res.status(200).json({
                error: false,
                message: 'Note updated successfully',
                note: note
            });
        } else {
            res.status(404).json({ error: true, message: 'Note not found' });
        }
    } catch (error) {
        res.status(400).json({ error: true, message: error.message });
    }
};

// Delete a note by ID
exports.deleteNote = async (req, res) => {
    const { id } = req.params;
    try {
        const note = await Note.findByPk(id);
        if (note) {
            note.isActive = false;
            await note.save();
            res.json({ message: 'Note deleted successfully' });
        } else {
            res.status(404).json({ error: true, message: 'Note not found' });
        }
    } catch (error) {
        res.status(400).json({ error: true, message: error.message });
    }
};
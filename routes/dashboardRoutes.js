import express from 'express';
import Dashboard from '../models/Dashboard.js';

const router = express.Router();

// Get dashboard data
router.get('/', async (req, res) => {
    try {
        let data = await Dashboard.findOne();
        if (!data) {
            data = new Dashboard();
            await data.save();
        }
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update dashboard data
router.put('/', async (req, res) => {
    try {
        const updateData = req.body;
        const data = await Dashboard.findOneAndUpdate(
            {},
            { ...updateData, updatedAt: Date.now() },
            { new: true, upsert: true }
        );
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reset dashboard (clear all data)
router.delete('/reset', async (req, res) => {
    try {
        await Dashboard.deleteMany({});
        const newData = new Dashboard();
        await newData.save();
        res.json({ message: 'Dashboard reset successfully', data: newData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
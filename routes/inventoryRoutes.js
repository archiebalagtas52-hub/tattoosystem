import express from 'express';
import Inventory from '../models/Inventory.js';

const router = express.Router();

// Get all inventory items
router.get('/', async (req, res) => {
    try {
        const items = await Inventory.find().sort({ createdAt: -1 });
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single inventory item
router.get('/:id', async (req, res) => {
    try {
        const item = await Inventory.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create inventory item
router.post('/', async (req, res) => {
    try {
        const item = new Inventory(req.body);
        await item.save();
        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update inventory item
router.put('/:id', async (req, res) => {
    try {
        const item = await Inventory.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete inventory item
router.delete('/:id', async (req, res) => {
    try {
        const item = await Inventory.findByIdAndDelete(req.params.id);
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update quantity (add or subtract)
router.patch('/:id/quantity', async (req, res) => {
    try {
        const { change } = req.body; // positive = add, negative = subtract
        const item = await Inventory.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        item.quantity += change;
        await item.save();
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get inventory summary (stats)
router.get('/summary/stats', async (req, res) => {
    try {
        const totalItems = await Inventory.countDocuments();
        const lowStock = await Inventory.countDocuments({ status: 'Low Stock' });
        const outOfStock = await Inventory.countDocuments({ status: 'Out of Stock' });
        const inStock = await Inventory.countDocuments({ status: 'In Stock' });
        
        const totalValue = await Inventory.aggregate([
            { $group: { _id: null, total: { $sum: { $multiply: ['$quantity', '$price'] } } } }
        ]);
        
        // Fixed for Node.js 13 - no optional chaining
        const totalValueResult = totalValue.length > 0 ? totalValue[0].total : 0;
        
        res.json({
            totalItems: totalItems,
            lowStock: lowStock,
            outOfStock: outOfStock,
            inStock: inStock,
            totalValue: totalValueResult
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
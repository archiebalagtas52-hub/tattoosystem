import mongoose from 'mongoose';

const InventorySchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    category: { 
        type: String, 
        enum: ['Ink', 'Needles', 'Machines', 'Accessories', 'Sanitation', 'Other'],
        required: true 
    },
    quantity: { 
        type: Number, 
        required: true,
        default: 0 
    },
    price: { 
        type: Number, 
        required: true,
        default: 0 
    },
    supplier: { 
        type: String,
        default: '' 
    },
    reorderLevel: { 
        type: Number,
        default: 5 
    },
    location: { 
        type: String,
        default: 'Storage' 
    },
    status: { 
        type: String, 
        enum: ['In Stock', 'Low Stock', 'Out of Stock'], 
        default: 'In Stock' 
    },
    lastUpdated: { 
        type: Date, 
        default: Date.now 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Auto-update status based on quantity
InventorySchema.pre('save', function(next) {
    if (this.quantity <= 0) {
        this.status = 'Out of Stock';
    } else if (this.quantity <= this.reorderLevel) {
        this.status = 'Low Stock';
    } else {
        this.status = 'In Stock';
    }
    this.lastUpdated = Date.now();
    next();
});

const Inventory = mongoose.model('Inventory', InventorySchema);

export default Inventory;
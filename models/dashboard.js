import mongoose from 'mongoose';

const DashboardSchema = new mongoose.Schema({
    revenue: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    projected: { type: Number, default: 0 },
    projectedTarget: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    totalBalance: { type: Number, default: 0 },
    todayEarnings: { type: Number, default: 0 },
    monthlyIncome: { type: Number, default: 0 },
    monthlyTotal: { type: Number, default: 0 },
    savings: { type: Number, default: 0 },
    savingsTotal: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    pendingTotal: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Dashboard', DashboardSchema);
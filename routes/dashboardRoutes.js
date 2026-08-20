import express from 'express';
import Dashboard from '../models/dashboard.js';
import Appointment from '../models/appoinment.js';
import requireRole from '../middleware/requireRole.js';

const router = express.Router();

const MONTH_LABELS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

function summarize(rows) {
    const revenue = rows.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
    const noShows = rows.filter((a) => a.status === 'Cancelled').length;

    return {
        count: rows.length,
        revenue,
        average: rows.length ? Math.round(revenue / rows.length) : 0,
        noShowRate: rows.length ? Math.round((noShows / rows.length) * 100) : 0
    };
}

function percentChange(current, previous) {
    if (!previous) {
        return current ? 100 : 0;
    }

    return Math.round(((current - previous) / previous) * 100);
}

function buildTrend(rows, months) {
    const now = new Date();
    const trend = [];

    for (let i = months - 1; i >= 0; i--) {
        const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

        trend.push({
            label: MONTH_LABELS[start.getMonth()],
            count: rows.filter((a) => {
                const date = new Date(a.date);
                return date >= start && date < end;
            }).length
        });
    }

    return trend;
}

// Metrics para sa dashboard cards, galing sa parehong appointments
// collection na ginagamit ng Client Appointments page.
router.get('/summary', requireRole('admin'), async (req, res) => {
    try {
        const rows = await Appointment.find({}).lean();

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const overall = summarize(rows);
        const thisMonth = summarize(rows.filter((a) => new Date(a.date) >= monthStart));
        const lastMonth = summarize(rows.filter((a) => {
            const date = new Date(a.date);
            return date >= previousMonthStart && date < monthStart;
        }));

        res.json({
            success: true,
            stats: {
                totalBookings: overall.count,
                revenue: overall.revenue,
                avgBookingValue: overall.average,
                noShowRate: overall.noShowRate,
                bookingsDelta: percentChange(thisMonth.count, lastMonth.count),
                revenueDelta: percentChange(thisMonth.revenue, lastMonth.revenue),
                avgDelta: percentChange(thisMonth.average, lastMonth.average),
                noShowDelta: percentChange(thisMonth.noShowRate, lastMonth.noShowRate),
                rangeLabel: now.toLocaleDateString('en-PH', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                })
            },
            recentBookings: [...rows]
                .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
                .slice(0, 8),
            upcomingAppointments: rows
                .filter((a) => new Date(a.date) >= todayStart && a.status !== 'Cancelled')
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .slice(0, 6),
            bookingTrend: buildTrend(rows, 8)
        });
    } catch (error) {
        console.error('GET /api/dashboard/summary', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

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
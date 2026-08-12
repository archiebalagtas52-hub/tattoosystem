import express from "express";
import mongoose from "mongoose";
import User from "../models/user.js";

const router = express.Router();

function apptModel() {
    const key = Object.keys(mongoose.models).find(n => n.toLowerCase().includes("appointment"));
    return key ? mongoose.models[key] : null;
}

router.get("/reports", async (req, res) => {
    try {
        const Appointment = apptModel();
        if (!Appointment) {
            return res.status(500).json({
                success: false,
                message: "Appointment model not registered: " + Object.keys(mongoose.models).join(", ")
            });
        }

        const appointments = await Appointment.find({}).sort({ date: -1 }).lean();
        const registered = await User.countDocuments({ role: "client" });
        const eq = (a, s) => String(a.status || "Pending").toLowerCase() === s;

        const map = new Map();
        for (const a of appointments) {
            const name = a.clientName || a.username || "Unknown";
            const k = name.trim().toLowerCase();
            if (!map.has(k)) {
                map.set(k, { name, phone: a.phone || "", username: a.username || "", count: 0 });
            }
            map.get(k).count++;
        }

        res.json({
            success: true,
            summary: {
                totalAppointments: appointments.length,
                totalClients: registered || map.size,
                pending: appointments.filter(a => eq(a, "pending")).length,
                completed: appointments.filter(a => eq(a, "completed")).length
            },
            appointments,
            clients: [...map.values()]
        });
    } catch (error) {
        console.error("Reports error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put("/:id/payment", async (req, res) => {
    try {
        const updated = await apptModel().findByIdAndUpdate(
            req.params.id, { payment: req.body.payment }, { new: true });
        if (!updated) return res.status(404).json({ success: false, message: "Appointment not found" });
        res.json({ success: true, appointment: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put("/:id/status", async (req, res) => {
    try {
        const updated = await apptModel().findByIdAndUpdate(
            req.params.id, { status: req.body.status }, { new: true });
        if (!updated) return res.status(404).json({ success: false, message: "Appointment not found" });
        res.json({ success: true, appointment: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
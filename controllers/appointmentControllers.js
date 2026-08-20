// controllers/appointmentController.js

import mongoose from "mongoose";
import Appointment from "../models/appoinment.js";

const VALID_STATUS = [
    "Pending",
    "Confirmed",
    "Rescheduled",
    "Completed",
    "Cancelled"
];

const VALID_PAYMENT = ["Unpaid", "Cash", "GCash", "Paid"];

function isValidId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

// ======================================================
// CLIENT
// ======================================================

// GET /api/appointments
export async function getMyAppointments(req, res) {
    try {
        const appointments = await Appointment
            .find({ userId: req.user.id })
            .sort({ date: 1, time: 1 })
            .lean();

        return res.json({ success: true, appointments });

    } catch (error) {
        console.error("getMyAppointments", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load appointments."
        });
    }
}

// POST /api/appointments  (multipart, field name: reference)
export async function createAppointment(req, res) {
    try {
        const clientName = (req.body.clientName || "").trim();
        const phone = (req.body.phone || "").trim();
        const artist = (req.body.artist || "").trim();
        const date = req.body.date;
        const time = req.body.time;
        const tattooType = req.body.tattooType;
        const description = (req.body.description || "").trim();

        if (!clientName || !phone || !artist || !date || !time || !tattooType) {
            return res.status(400).json({
                success: false,
                message: "Please complete all required fields."
            });
        }

        const parsedDate = new Date(date);

        if (isNaN(parsedDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid appointment date."
            });
        }

        // Reference photo: alinman sa sariling upload ng client, o ang
        // napiling design galing sa Photos Gallery (referenceUrl).
        let reference = "";

        if (req.file) {
            reference = "/uploads/" + req.file.filename;
        } else if (typeof req.body.referenceUrl === "string") {
            const chosen = req.body.referenceUrl.trim();

            // Local path lang - hindi tumatanggap ng panlabas na URL
            if (/^\/uploads\//.test(chosen)) {
                reference = chosen;
            }
        }

        const appointment = await Appointment.create({
            clientName,
            phone,
            artist,
            date: parsedDate,
            time,
            tattooType,
            description,
            reference,
            username: req.user.username,
            userId: req.user.id,
            status: "Pending"
        });

        return res.status(201).json({ success: true, appointment });

    } catch (error) {
        console.error("createAppointment", error);
        return res.status(500).json({
            success: false,
            message: "Failed to book appointment."
        });
    }
}

// DELETE /api/appointments/:id
export async function cancelMyAppointment(req, res) {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid appointment id."
            });
        }

        const appointment = await Appointment.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { status: "Cancelled" },
            { new: true }
        );

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found."
            });
        }

        return res.json({ success: true, appointment });

    } catch (error) {
        console.error("cancelMyAppointment", error);
        return res.status(500).json({
            success: false,
            message: "Failed to cancel appointment."
        });
    }
}

// ======================================================
// ADMIN
// ======================================================

// GET /api/appointments/admin/all
export async function getAllAppointments(req, res) {
    try {
        const appointments = await Appointment
            .find({})
            .sort({ date: -1, time: -1 })
            .lean();

        return res.json({ success: true, appointments });

    } catch (error) {
        console.error("getAllAppointments", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load appointments."
        });
    }
}

// GET /api/appointments/admin/reports
export async function getReports(req, res) {
    try {
        const appointments = await Appointment
            .find({})
            .sort({ date: -1, time: -1 })
            .lean();

        const clientMap = new Map();

        appointments.forEach(function (appointment) {
            const key = appointment.userId || appointment.clientName;

            if (!clientMap.has(key)) {
                clientMap.set(key, {
                    name: appointment.clientName,
                    username: appointment.username || "",
                    phone: appointment.phone || "",
                    count: 0
                });
            }

            clientMap.get(key).count += 1;
        });

        const clients = Array
            .from(clientMap.values())
            .sort(function (a, b) { return b.count - a.count; });

        const countBy = function (status) {
            return appointments.filter(function (a) {
                return a.status === status;
            }).length;
        };

        return res.json({
            success: true,
            summary: {
                totalAppointments: appointments.length,
                totalClients: clients.length,
                pending: countBy("Pending"),
                confirmed: countBy("Confirmed"),
                completed: countBy("Completed"),
                cancelled: countBy("Cancelled")
            },
            appointments,
            clients
        });

    } catch (error) {
        console.error("getReports", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load reports."
        });
    }
}

// PUT /api/appointments/admin/:id/status
export async function updateStatus(req, res) {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid appointment id."
            });
        }

        const status = req.body.status;

        if (!VALID_STATUS.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status."
            });
        }

        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found."
            });
        }

        return res.json({ success: true, appointment });

    } catch (error) {
        console.error("updateStatus", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update status."
        });
    }
}

// PUT /api/appointments/admin/:id/payment
export async function updatePayment(req, res) {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid appointment id."
            });
        }

        const payment = req.body.payment;

        if (!VALID_PAYMENT.includes(payment)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment type."
            });
        }

        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { payment },
            { new: true }
        );

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found."
            });
        }

        return res.json({ success: true, appointment });

    } catch (error) {
        console.error("updatePayment", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update payment."
        });
    }
}

// PUT /api/appointments/admin/:id/reschedule
export async function rescheduleAppointment(req, res) {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid appointment id."
            });
        }

        const parsedDate = new Date(req.body.date);

        if (!req.body.date || isNaN(parsedDate.getTime()) || !req.body.time) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid new date and time."
            });
        }

        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            {
                date: parsedDate,
                time: req.body.time,
                status: "Rescheduled"
            },
            { new: true }
        );

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found."
            });
        }

        return res.json({ success: true, appointment });

    } catch (error) {
        console.error("rescheduleAppointment", error);
        return res.status(500).json({
            success: false,
            message: "Failed to reschedule appointment."
        });
    }
}

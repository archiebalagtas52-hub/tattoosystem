// routes/appointmentRoutes.js
//
// STANDALONE - walang import sa middleware/ o controllers/ o models/.
// Ilagay lang ito sa routes/ at gagana agad.
//
// Mounted sa server.js:
//     app.use("/api/appointments", appointmentRoutes);
//
// Kailangan: npm install multer

import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import fs from "fs";

// ======================================================
// UPLOAD
// ======================================================

const uploadDir = path.join(process.cwd(), "public", "uploads");

fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, uploadDir);
        },
        filename: function (req, file, cb) {
            const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
            cb(null, unique + path.extname(file.originalname).toLowerCase());
        }
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        cb(null, /^image\//.test(file.mimetype));
    }
});

// ======================================================
// MODEL
// ======================================================

const appointmentSchema = new mongoose.Schema(
    {
        clientName: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
        artist: { type: String, required: true, trim: true },
        date: { type: Date, required: true },
        time: { type: String, required: true },
        tattooType: { type: String, required: true },
        description: { type: String, default: "" },

        // Path ng reference photo, hal. "/uploads/1699999999-123.jpg"
        reference: { type: String, default: "" },

        username: { type: String, default: "" },
        userId: { type: String, required: true, index: true },

        status: {
            type: String,
            enum: ["Pending", "Confirmed", "Rescheduled", "Completed", "Cancelled"],
            default: "Pending"
        },

        payment: {
            type: String,
            enum: ["Unpaid", "Cash", "GCash", "Paid"],
            default: "Unpaid"
        }
    },
    { timestamps: true }
);

const Appointment =
    mongoose.models.Appointment ||
    mongoose.model("Appointment", appointmentSchema);

// ======================================================
// AUTH
// ======================================================

function requireLogin(req, res, next) {
    if (!req.cookies || !req.cookies.userId) {
        return res.status(401).json({
            success: false,
            message: "Not logged in."
        });
    }

    req.user = {
        id: req.cookies.userId,
        username: req.cookies.username || "",
        role: req.cookies.role || "client"
    };

    next();
}

function requireAdmin(req, res, next) {
    requireLogin(req, res, function () {
        if (req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Admins only."
            });
        }

        next();
    });
}

// ======================================================
// HELPERS
// ======================================================

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

const router = express.Router();

// ======================================================
// ADMIN - dapat nauuna kaysa sa /:id
// ======================================================

router.get("/admin/all", requireAdmin, async (req, res) => {
    try {
        const appointments = await Appointment
            .find({})
            .sort({ date: -1, time: -1 })
            .lean();

        return res.json({ success: true, appointments });

    } catch (error) {
        console.error("GET /api/appointments/admin/all", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load appointments."
        });
    }
});

router.get("/admin/reports", requireAdmin, async (req, res) => {
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
        console.error("GET /api/appointments/admin/reports", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load reports."
        });
    }
});

router.put("/admin/:id/status", requireAdmin, async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid appointment id."
            });
        }

        if (!VALID_STATUS.includes(req.body.status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status."
            });
        }

        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
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
        console.error("PUT /api/appointments/admin/:id/status", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update status."
        });
    }
});

router.put("/admin/:id/payment", requireAdmin, async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid appointment id."
            });
        }

        if (!VALID_PAYMENT.includes(req.body.payment)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment type."
            });
        }

        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { payment: req.body.payment },
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
        console.error("PUT /api/appointments/admin/:id/payment", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update payment."
        });
    }
});

router.put("/admin/:id/reschedule", requireAdmin, async (req, res) => {
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
        console.error("PUT /api/appointments/admin/:id/reschedule", error);
        return res.status(500).json({
            success: false,
            message: "Failed to reschedule appointment."
        });
    }
});

// ======================================================
// CLIENT
// ======================================================

router.get("/", requireLogin, async (req, res) => {
    try {
        const appointments = await Appointment
            .find({ userId: req.user.id })
            .sort({ date: 1, time: 1 })
            .lean();

        return res.json({ success: true, appointments });

    } catch (error) {
        console.error("GET /api/appointments", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load appointments."
        });
    }
});

router.post("/", requireLogin, upload.single("reference"), async (req, res) => {
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

        // Reference photo: sariling upload ng client, o ang napiling
        // design galing sa Photos Gallery (referenceUrl).
        let reference = "";

        if (req.file) {
            reference = "/uploads/" + req.file.filename;
        } else if (typeof req.body.referenceUrl === "string") {
            const chosen = req.body.referenceUrl.trim();

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
        console.error("POST /api/appointments", error);
        return res.status(500).json({
            success: false,
            message: "Failed to book appointment."
        });
    }
});

router.delete("/:id", requireLogin, async (req, res) => {
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
        console.error("DELETE /api/appointments/:id", error);
        return res.status(500).json({
            success: false,
            message: "Failed to cancel appointment."
        });
    }
});

export default router;

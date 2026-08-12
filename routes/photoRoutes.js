// routes/photoRoutes.js  (STANDALONE - kasama na ang model dito)
//
// Mounted in server.js as:
//     app.use("/api/photos", photoRoutes);
//
// Public / client:
//     GET    /api/photos                -> lahat ng photo (pwedeng ?category=gallery|design)
// Admin lang:
//     POST   /api/photos                -> upload (multipart: image, title, caption, category)
//     DELETE /api/photos/:id            -> burahin ang photo

import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import fs from "fs";

// ======================================================
// UPLOAD (public/uploads/photos)
// ======================================================

const uploadDir = path.join(process.cwd(), "public", "uploads", "photos");

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

const photoSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        caption: {
            type: String,
            default: ""
        },

        // "gallery" = tapos nang tattoo, "design" = mapipili ng client
        category: {
            type: String,
            enum: ["gallery", "design"],
            default: "gallery"
        },

        image: {
            type: String,
            required: true
        },

        uploadedBy: {
            type: String,
            default: ""
        }
    },
    { timestamps: true }
);

const Photo =
    mongoose.models.Photo ||
    mongoose.model("Photo", photoSchema);


const router = express.Router();

// ======================================================
// AUTH
// ======================================================

function requireAdmin(req, res, next) {
    if (!req.cookies || !req.cookies.userId) {
        return res.status(401).json({
            success: false,
            message: "Not logged in."
        });
    }

    if (req.cookies.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Admins only."
        });
    }

    next();
}

// ======================================================
// LIST - bukas sa lahat (client at admin)
// ======================================================

router.get("/", async (req, res) => {
    try {
        const filter = {};

        if (req.query.category === "gallery" || req.query.category === "design") {
            filter.category = req.query.category;
        }

        const photos = await Photo
            .find(filter)
            .sort({ createdAt: -1 })
            .lean();

        return res.json({ success: true, photos });

    } catch (error) {
        console.error("GET /api/photos", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load photos."
        });
    }
});

// ======================================================
// UPLOAD - admin lang
// ======================================================

router.post("/", requireAdmin, upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please choose an image file."
            });
        }

        const title = (req.body.title || "").trim();

        if (!title) {
            return res.status(400).json({
                success: false,
                message: "Title is required."
            });
        }

        const category = req.body.category === "design" ? "design" : "gallery";

        const photo = await Photo.create({
            title,
            caption: (req.body.caption || "").trim(),
            category,
            image: "/uploads/photos/" + req.file.filename,
            uploadedBy: req.cookies.username || "admin"
        });

        return res.status(201).json({ success: true, photo });

    } catch (error) {
        console.error("POST /api/photos", error);
        return res.status(500).json({
            success: false,
            message: "Failed to upload photo."
        });
    }
});

// ======================================================
// DELETE - admin lang
// ======================================================

router.delete("/:id", requireAdmin, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid photo id."
            });
        }

        const photo = await Photo.findByIdAndDelete(req.params.id);

        if (!photo) {
            return res.status(404).json({
                success: false,
                message: "Photo not found."
            });
        }

        // Burahin din ang file sa disk
        const filePath = path.join(process.cwd(), "public", photo.image);

        fs.unlink(filePath, function () {
            // walang gagawin kung wala na ang file
        });

        return res.json({ success: true });

    } catch (error) {
        console.error("DELETE /api/photos/:id", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete photo."
        });
    }
});

export default router;

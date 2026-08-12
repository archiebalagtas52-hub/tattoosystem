// controllers/photoController.js

import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import Photo from "../models/photo.js";

// GET /api/photos            (bukas sa client at admin)
// GET /api/photos?category=design
export async function getPhotos(req, res) {
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
        console.error("getPhotos", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load photos."
        });
    }
}

// POST /api/photos           (admin lang, multipart field: image)
export async function uploadPhoto(req, res) {
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
            uploadedBy: req.user.username || "admin"
        });

        return res.status(201).json({ success: true, photo });

    } catch (error) {
        console.error("uploadPhoto", error);
        return res.status(500).json({
            success: false,
            message: "Failed to upload photo."
        });
    }
}

// DELETE /api/photos/:id     (admin lang)
export async function deletePhoto(req, res) {
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

        fs.unlink(path.join(process.cwd(), "public", photo.image), function () {
            // walang gagawin kung wala na ang file sa disk
        });

        return res.json({ success: true });

    } catch (error) {
        console.error("deletePhoto", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete photo."
        });
    }
}

// models/photo.js

import mongoose from "mongoose";

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

        // "gallery" = tapos nang tattoo
        // "design"  = pwedeng piliin ng client sa booking
        category: {
            type: String,
            enum: ["gallery", "design"],
            default: "gallery"
        },

        // Path ng larawan, hal. "/uploads/photos/1699999999-123.jpg"
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

export default Photo;

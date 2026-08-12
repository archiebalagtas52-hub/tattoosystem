// models/appointment.js

import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
    {
        clientName: {
            type: String,
            required: true,
            trim: true
        },

        phone: {
            type: String,
            required: true,
            trim: true
        },

        artist: {
            type: String,
            required: true,
            trim: true
        },

        date: {
            type: Date,
            required: true
        },

        time: {
            type: String,
            required: true
        },

        tattooType: {
            type: String,
            required: true
        },

        description: {
            type: String,
            default: ""
        },

        // Path ng reference photo, hal. "/uploads/1699999999-123.jpg"
        reference: {
            type: String,
            default: ""
        },

        username: {
            type: String,
            default: ""
        },

        userId: {
            type: String,
            required: true,
            index: true
        },

        status: {
            type: String,
            enum: [
                "Pending",
                "Confirmed",
                "Rescheduled",
                "Completed",
                "Cancelled"
            ],
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

export default Appointment;

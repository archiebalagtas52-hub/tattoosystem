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

        // Ang pangalan na ito ang ipinapadala ng booking form at ito rin
        // ang binabasa ng My Appointments table (a.tattooSize).
        tattooSize: {
            type: String,
            enum: ["", "Small", "Medium", "Large", "Custom"],
            default: ""
        },

        // Sukat sa pulgada kapag Custom ang tattooSize.
        customWidth: {
            type: Number,
            default: null,
            min: 0
        },

        customHeight: {
            type: Number,
            default: null,
            min: 0
        },

        placement: {
            type: String,
            default: ""
        },

        // Laman kapag "Other" ang napiling placement.
        placementOther: {
            type: String,
            default: ""
        },

        placementSide: {
            type: String,
            default: ""
        },

        amount: {
            type: Number,
            default: 0,
            min: 0
        },

        // Cash o GCash.
        paymentMethod: {
            type: String,
            enum: ["", "Cash", "GCash"],
            default: ""
        },

        // Kung magkano na ang nabayaran ng client.
        paymentAmount: {
            type: Number,
            default: 0,
            min: 0
        },

        // Kung magkano pa ang kulang na babayaran.
        balance: {
            type: Number,
            default: 0,
            min: 0
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

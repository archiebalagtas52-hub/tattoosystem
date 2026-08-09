import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({

    client: {
        type: String,
        required: true,
        trim: true
    },

    contact: {
        type: String,
        default: "",
        trim: true
    },

    artist: {
        type: String,
        default: "",
        trim: true
    },

    // Stored as "YYYY-MM-DD" so it matches the <input type="date"> value directly
    date: {
        type: String,
        required: true
    },

    // Stored as "HH:mm" (24-hour) so it matches <input type="time">
    time: {
        type: String,
        required: true
    },

    service: {
        type: String,
        default: "",
        trim: true
    },

    status: {
        type: String,
        enum: ["Pending", "Confirmed", "Rescheduled", "Cancelled"],
        default: "Pending"
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

const appointment = mongoose.model("appointment", appointmentSchema);

export default appointment;

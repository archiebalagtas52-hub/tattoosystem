import mongoose from "mongoose";

const userSchema = new mongoose.Schema({

    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        enum: ["admin", "client"],
        default: "client",
        required: true
    },

    isActive: {
        type: Boolean,
        default: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

const User = mongoose.model("User", userSchema);

export default User;

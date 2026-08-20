// services/inventoryConsumption.js
//
// Binabawasan ng 1 ang bawat consumable na item (inks, needles, gloves, etc.)
// kapag natapos ("Completed") ang isang appointment.
//
// Idempotent: gumagamit ng inventoryConsumedAt flag sa appointment para hindi
// mabawasan ng dalawang beses ang stock kung paulit-ulit i-save ang status.

import mongoose from "mongoose";

function inventoryModel() {
    if (mongoose.models.Inventory) {
        return mongoose.models.Inventory;
    }

    const inventorySchema = new mongoose.Schema(
        {
            name: { type: String, required: true, trim: true },
            category: { type: String, default: "Other" },
            quantity: { type: Number, default: 0, min: 0 },
            unit: { type: String, default: "pcs" },
            reorderLevel: { type: Number, default: 5, min: 0 },
            consumePerAppointment: { type: Boolean, default: true }
        },
        { timestamps: true }
    );

    return mongoose.model("Inventory", inventorySchema, "inventories");
}

export async function consumeInventoryForAppointment(appointment) {
    if (!appointment || appointment.inventoryConsumedAt) {
        return { consumed: 0, skipped: true };
    }

    const Inventory = inventoryModel();

    const result = await Inventory.updateMany(
        { consumePerAppointment: true, quantity: { $gt: 0 } },
        { $inc: { quantity: -1 } }
    );

    appointment.inventoryConsumedAt = new Date();

    if (typeof appointment.save === "function") {
        await appointment.save();
    }

    return { consumed: result.modifiedCount || 0, skipped: false };
}

export default consumeInventoryForAppointment;

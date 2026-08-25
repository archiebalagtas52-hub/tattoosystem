import mongoose from "mongoose";

const hygieneSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
      trim: true,
      default: "Free Tattoo Ointment Cream",
    },

    description: {
      type: String,
      default:
        "Complimentary ointment cream provided to clients after a tattoo session.",
      trim: true,
    },

    category: {
      type: String,
      default: "Tattoo Ointment Cream",
      trim: true,
    },

    price: {
      type: Number,
      default: 0,
      min: 0,
    },

    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },

    status: {
      type: String,
      default: "Included",
      enum: ["Included", "Out of Stock"],
    },

    givenAfterSession: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Hygiene = mongoose.model("Hygiene", hygieneSchema);

export default Hygiene;
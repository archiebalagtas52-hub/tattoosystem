import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log("MongoDB has been Connected");
    } catch (error) {
        console.error("MongoDB has been  Failed");
        console.error(error.message);
        process.exit(1);
    }
};

export default connectDB;
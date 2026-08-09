import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/database.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import User from "./models/user.js";
import bcrypt from "bcrypt";
import requireRole from "./middleware/requireRole.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// ======================================================
// MIDDLEWARE
// ======================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// ======================================================
// PUBLIC
// ======================================================

app.use(express.static(path.join(__dirname, "public")));


// ======================================================
// EJS
// ======================================================

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));




// ======================================================
// API ROUTES
// ======================================================

app.use("/api/dashboard", dashboardRoutes);
app.use("/api/appointment", appointmentRoutes);
app.use("/api/inventory", inventoryRoutes);


// ======================================================
// ROLE HELPERS
// ======================================================

const homeFor = (role) => (role === "admin" ? "/dashboard" : "/clientdashboard");


// ======================================================
// CREATE ADMIN
// ======================================================

const initializeAdmin = async () => {

    try {

        let admin = await User.findOne({
            username: "admin"
        });


        // ==================================================
        // CREATE ADMIN IF IT DOESN'T EXIST
        // ==================================================

        if (!admin) {

            const hashedPassword = await bcrypt.hash(
                "admin123",
                10
            );

            admin = new User({
                username: "admin",
                password: hashedPassword,
                role: "admin",
                isActive: true
            });

            await admin.save();

            console.log("=================================");
            console.log("✅ ADMIN CREATED");
            console.log("Username: admin");
            console.log("Password: admin123");
            console.log("Role: admin");
            console.log("=================================");

        } else {

            // Don't reset the password every startup
            admin.role = "admin";

            if (admin.isActive === undefined) {
                admin.isActive = true;
            }

            await admin.save();

            console.log("=================================");
            console.log("✅ ADMIN ACCOUNT EXISTS");
            console.log("Username:", admin.username);
            console.log("Role:", admin.role);
            console.log("=================================");
        }

    } catch (error) {

        console.error(
            "❌ Admin initialization error:",
            error
        );
    }
};


// ======================================================
// PAGE ROUTES
// ======================================================

app.get("/", (req, res) => {
    res.render("login");
});

app.get("/login", (req, res) => {

    const userId = req.cookies.userId;
    const role = req.cookies.role;

    // Already logged in
    if (userId) {
        return res.redirect(homeFor(role));
    }

    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/dashboard", requireRole("admin"), (req, res) => {
    res.render("dashboard");
});

app.get("/clientdashboard", requireRole("client"), (req, res) => {
    res.render("clientdashboard");
});

app.get('/appointment', (req, res) => {
    res.render('appointment');
});

app.get("/inventory", (req, res) => {
    res.render("inventory");
});

app.get("/aboutus", (req, res) => {
    res.render("aboutus");
});

app.get("/photos", (req, res) => {
    res.render("photos");
});

app.get("/reports", (req, res) => {
    res.render("report&records");
});

app.get('/clientappointment', (req, res) => {
    res.render('clientappointment');
});

// ======================================================
// LOGOUT
// ======================================================

app.get("/logout", (req, res) => {

    res.clearCookie("userId");
    res.clearCookie("username");
    res.clearCookie("role");

    res.redirect("/login");
});


// ======================================================
// LOGIN API
// ======================================================

app.post('/clientappointment', (req, res) => {
    try {
        // Get form data
        const { name, date, time, service } = req.body;
        
        // Process/save data here (database, etc.)
        console.log('Appointment received:', { name, date, time, service });
        
        // Send success response
        res.render('clientappointment', { 
            success: true,
            message: 'Appointment booked successfully!',
            appointmentData: req.body
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.render('clientappointment', { 
            error: 'Failed to book appointment. Please try again.' 
        });
    }
});

app.post("/login", async (req, res) => {
    let username = "";
    let password = "";

    if (req.body.username) {
        username = req.body.username.trim();
    }

    if (req.body.password) {
        password = req.body.password;
    }

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: "Username and password are required"
        });
    }

    try {
        const user = await User.findOne({ username: username });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }

        if (user.isActive === false) {
            return res.status(401).json({
                success: false,
                message: "Your account is inactive."
            });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 365 * 24 * 60 * 60 * 1000
        };

        res.cookie("userId", user._id.toString(), cookieOptions);
        res.cookie("username", user.username, cookieOptions);
        res.cookie("role", user.role, cookieOptions);

        console.log("=================================");
        console.log("LOGIN SUCCESS");
        console.log("Username:", user.username);
        console.log("Role from DB:", user.role);
        console.log("=================================");

        // Redirect based on role
        return res.status(200).json({
            success: true,
            message: "Login successful!",
            role: user.role,
            redirectUrl: homeFor(user.role)
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error during login"
        });
    }
});


app.post("/register", async function(req, res) {

    var username = "";
    var password = "";

    if (req.body.username) {
        username = req.body.username.trim();
    }

    if (req.body.password) {
        password = req.body.password;
    }

    // ==================================================
    // REQUIRED FIELDS
    // ==================================================

    if (!username || !password) {

        return res.status(400).json({
            success: false,
            message: "Please complete all registration fields."
        });
    }


    // ==================================================
    // USERNAME
    // ==================================================

    if (username.length < 3) {

        return res.status(400).json({
            success: false,
            message: "Username must be at least 3 characters."
        });
    }


    // ==================================================
    // PASSWORD LENGTH
    // ==================================================

    if (password.length < 6) {

        return res.status(400).json({
            success: false,
            message: "Password must be at least 6 characters."
        });
    }


    try {

        // ==================================================
        // CHECK MONGODB
        // ==================================================

        var existingUser = await User.findOne({
            username: username
        });


        if (existingUser) {

            return res.status(409).json({
                success: false,
                message: "Username already exists."
            });
        }


        // ==================================================
        // HASH PASSWORD
        // ==================================================

        var hashedPassword = await bcrypt.hash(
            password,
            10
        );


        // ==================================================
        // CREATE CLIENT
        // ==================================================

        var newUser = new User({
            username: username,
            password: hashedPassword,
            role: "client",
            isActive: true
        });


        // ==================================================
        // SAVE TO MONGODB
        // ==================================================

        await newUser.save();


        console.log("=================================");
        console.log("CLIENT REGISTERED");
        console.log("Username:", username);
        console.log("Role: client");
        console.log("=================================");


        // ==================================================
        // VERIFY PASSWORD HASH MATCHES
        // ==================================================

        // Retrieve the saved user to verify
        var savedUser = await User.findOne({
            username: username
        });

        // Compare the provided password with the stored hash
        var passwordMatch = await bcrypt.compare(password, savedUser.password);

        if (passwordMatch) {
            // Password matches - redirect to login
            console.log("Password verification: SUCCESS");
            return res.status(201).json({
                success: true,
                message: "Registration successful! Please login.",
                redirectUrl: "/login"
            });
        } else {
            // Password doesn't match - this should not happen but just in case
            console.log("Password verification: FAILED");
            return res.status(500).json({
                success: false,
                message: "Registration verification failed. Please register again."
            });
        }


    } catch (error) {

        console.error(
            "REGISTRATION ERROR:",
            error
        );


        return res.status(500).json({
            success: false,
            message: "Registration failed. Please try again."
        });
    }

});



const startServer = async () => {

    try {

        console.log("Connecting to MongoDB...");

        // Connect database
        connectDB();

        // Give MongoDB a moment to connect
        setTimeout(async () => {

            await initializeAdmin();

        }, 1000);


        // Start server immediately
        app.listen(PORT, () => {

            console.log(
                ` Server running at http://localhost:${PORT}`
            );

        });

    } catch (error) {

        console.error(
            "Server error:",
            error
        );

    }
};


startServer();

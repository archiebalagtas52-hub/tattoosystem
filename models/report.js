import Appointment from "./models/appointment.js"; // palitan kung iba ang filename

app.get("/api/reports/stats", async (req, res) => {
    try {
        const [totalAppointments, totalClients, pending, completed] = await Promise.all([
            Appointment.countDocuments({}),
            User.countDocuments({ role: "client" }),
            Appointment.countDocuments({ status: "pending" }),
            Appointment.countDocuments({ status: "completed" })
        ]);
        res.json({ success: true, totalAppointments, totalClients, pending, completed });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
import User from "../models/user.js";

const homeFor = (role) => (role === "admin" ? "/dashboard" : "/clientdashboard");

export default function requireRole(role) {
    return async (req, res, next) => {
        const userId = req.cookies.userId;

        if (!userId) {
            return res.redirect("/login");
        }

        try {
            const user = await User.findById(userId);

            if (!user || user.isActive === false) {
                res.clearCookie("userId");
                res.clearCookie("username");
                res.clearCookie("role");
                return res.redirect("/login");
            }

            if (user.role !== role) {
                const target = homeFor(user.role);

                // Never redirect back to the page we are already on
                if (target === req.path) {
                    res.clearCookie("userId");
                    res.clearCookie("username");
                    res.clearCookie("role");
                    return res
                        .status(403)
                        .send(
                            `Access denied. Your account role is "${user.role}", which has no dashboard. ` +
                            `Set it to "admin" or "client" in MongoDB, then log in again.`
                        );
                }

                return res.redirect(target);
            }

            req.user = user;
            next();
        } catch (error) {
            console.error("requireRole error:", error);
            res.clearCookie("userId");
            res.clearCookie("username");
            res.clearCookie("role");
            return res.redirect("/login");
        }
    };
}

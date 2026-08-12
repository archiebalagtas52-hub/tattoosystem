// middleware/auth.js
//
// Cookie-based auth para sa API routes.

export function requireLogin(req, res, next) {
    if (!req.cookies || !req.cookies.userId) {
        return res.status(401).json({
            success: false,
            message: "Not logged in."
        });
    }

    req.user = {
        id: req.cookies.userId,
        username: req.cookies.username || "",
        role: req.cookies.role || "client"
    };

    next();
}

export function requireAdmin(req, res, next) {
    requireLogin(req, res, function () {
        if (req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Admins only."
            });
        }

        next();
    });
}

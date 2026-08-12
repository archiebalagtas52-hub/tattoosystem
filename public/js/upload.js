// middleware/upload.js
//
// Multer storage para sa mga larawan. Lahat ay napupunta sa public/
// kaya diretsong naa-access sa browser (hal. /uploads/xxx.jpg).

import multer from "multer";
import path from "path";
import fs from "fs";

function createUploader(subfolder) {
    const uploadDir = path.join(process.cwd(), "public", subfolder);

    fs.mkdirSync(uploadDir, { recursive: true });

    return multer({
        storage: multer.diskStorage({
            destination: function (req, file, cb) {
                cb(null, uploadDir);
            },
            filename: function (req, file, cb) {
                const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
                cb(null, unique + path.extname(file.originalname).toLowerCase());
            }
        }),
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: function (req, file, cb) {
            cb(null, /^image\//.test(file.mimetype));
        }
    });
}

// Reference photo ng appointment -> /uploads/<file>
export const appointmentUpload = createUploader("uploads");

// Gallery photo ng admin -> /uploads/photos/<file>
export const photoUpload = createUploader(path.join("uploads", "photos"));

export default createUploader;

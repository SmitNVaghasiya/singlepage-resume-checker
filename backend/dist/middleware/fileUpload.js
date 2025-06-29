"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMulterError = exports.uploadFields = exports.uploadSingle = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const config_1 = require("../config/config");
// Configure multer for memory storage
const storage = multer_1.default.memoryStorage();
// File filter function
const fileFilter = (_req, file, cb) => {
    // Get file extension
    const ext = path_1.default.extname(file.originalname).toLowerCase().slice(1);
    // Check if file type is allowed
    if (config_1.config.allowedFileTypes.includes(ext)) {
        cb(null, true);
    }
    else {
        cb(new Error(`File type not allowed. Allowed types: ${config_1.config.allowedFileTypes.join(', ')}`));
    }
};
// Create multer upload instance
exports.upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: config_1.config.maxFileSize,
        files: 2, // Maximum 2 files (resume and job description)
    },
    fileFilter: fileFilter,
});
// Middleware for single file upload
const uploadSingle = (fieldName) => exports.upload.single(fieldName);
exports.uploadSingle = uploadSingle;
// Middleware for multiple file upload
exports.uploadFields = exports.upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'jobDescription', maxCount: 1 },
]);
// Error handler for multer
const handleMulterError = (err, _req, res, next) => {
    if (err instanceof multer_1.default.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
                error: 'File too large',
                message: `File size exceeds the maximum limit of ${config_1.config.maxFileSize / 1024 / 1024}MB`,
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                error: 'Too many files',
                message: 'Maximum 2 files allowed',
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                error: 'Unexpected field',
                message: 'Invalid file field name',
            });
        }
    }
    next(err);
};
exports.handleMulterError = handleMulterError;
//# sourceMappingURL=fileUpload.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAnalysisId = exports.validateAnalysisRequest = exports.validate = void 0;
const express_validator_1 = require("express-validator");
// Validation middleware wrapper
const validate = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            error: 'Validation Error',
            details: errors.array(),
        });
        return;
    }
    next();
};
exports.validate = validate;
// Validate analysis request
exports.validateAnalysisRequest = [
    (req, res, next) => {
        // Check if files are present
        if (!req.files || typeof req.files !== 'object') {
            res.status(400).json({
                error: 'Missing files',
                message: 'Both resume and job description files are required',
            });
            return;
        }
        const files = req.files;
        if (!files.resume || files.resume.length === 0) {
            res.status(400).json({
                error: 'Missing resume',
                message: 'Resume file is required',
            });
            return;
        }
        if (!files.jobDescription || files.jobDescription.length === 0) {
            res.status(400).json({
                error: 'Missing job description',
                message: 'Job description file is required',
            });
            return;
        }
        next();
    },
];
// Validate analysis ID
exports.validateAnalysisId = [
    (0, express_validator_1.param)('analysisId')
        .isString()
        .notEmpty()
        .withMessage('Analysis ID is required')
        .isAlphanumeric()
        .withMessage('Invalid analysis ID format'),
    exports.validate,
];
//# sourceMappingURL=validation.js.map
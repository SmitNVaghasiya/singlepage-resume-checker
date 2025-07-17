import { Request, Response, NextFunction } from 'express';
import { param, validationResult } from 'express-validator';

// Validation error handler
const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
    return;
  }

  res.status(400).json({
    error: 'Validation failed',
    details: errors.array(),
  });
};

// Validate analysis request - updated to support job description text
export const validateAnalysisRequest = [
  (req: Request, res: Response, next: NextFunction): void => {
    // Check if files are present
    if (!req.files || typeof req.files !== 'object') {
      res.status(400).json({
        error: 'Missing files',
        message: 'Resume file is required',
      });
      return;
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!files.resume || files.resume.length === 0) {
      res.status(400).json({
        error: 'Missing resume',
        message: 'Resume file is required',
      });
      return;
    }

    // Job description can be either file or text
    const { jobDescriptionText } = req.body;
    const hasJobDescriptionFile = files.jobDescription && files.jobDescription.length > 0;
    
    if (!hasJobDescriptionFile && !jobDescriptionText) {
      res.status(400).json({
        error: 'Missing job description',
        message: 'Either job description file or text is required',
      });
      return;
    }

    // Validate job description text if provided
    if (jobDescriptionText && typeof jobDescriptionText !== 'string') {
      res.status(400).json({
        error: 'Invalid job description text',
        message: 'Job description text must be a string',
      });
      return;
    }

    // Validate job description text length if provided
    if (jobDescriptionText && jobDescriptionText.trim().length < 50) {
      res.status(400).json({
        error: 'Job description too short',
        message: 'Job description text must be at least 50 characters long',
      });
      return;
    }

    next();
  },
];

// Validate analysis ID
export const validateAnalysisId = [
  param('analysisId')
    .isString()
    .notEmpty()
    .withMessage('Analysis ID is required')
    .matches(/^[a-zA-Z0-9-]+$/)
    .withMessage('Invalid analysis ID format'),
  validate,
];

export { validate }; 
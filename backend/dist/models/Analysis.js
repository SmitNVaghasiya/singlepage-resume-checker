"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Analysis = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// MongoDB Schema
const keywordMatchSchema = new mongoose_1.Schema({
    matched: [{ type: String }],
    missing: [{ type: String }],
    percentage: { type: Number, default: 0 },
    suggestions: [{ type: String }]
}, { _id: false });
const skillCategorySchema = new mongoose_1.Schema({
    required: [{ type: String }],
    present: [{ type: String }],
    missing: [{ type: String }],
    recommendations: [{ type: String }]
}, { _id: false });
const skillsAnalysisSchema = new mongoose_1.Schema({
    technical: skillCategorySchema,
    soft: skillCategorySchema,
    industry: skillCategorySchema
}, { _id: false });
const experienceAnalysisSchema = new mongoose_1.Schema({
    yearsRequired: { type: Number, default: 0 },
    yearsFound: { type: Number, default: 0 },
    relevant: { type: Boolean, default: true },
    experienceGaps: [{ type: String }],
    strengthAreas: [{ type: String }],
    improvementAreas: [{ type: String }]
}, { _id: false });
const qualitySubsectionSchema = new mongoose_1.Schema({
    score: { type: Number, default: 0 },
    issues: [{ type: String }],
    suggestions: [{ type: String }]
}, { _id: false });
const resumeQualitySchema = new mongoose_1.Schema({
    formatting: qualitySubsectionSchema,
    content: qualitySubsectionSchema,
    length: {
        score: { type: Number, default: 0 },
        wordCount: { type: Number, default: 0 },
        recommendations: [{ type: String }]
    },
    structure: {
        score: { type: Number, default: 0 },
        missingSections: [{ type: String }],
        suggestions: [{ type: String }]
    }
}, { _id: false });
const competitiveAnalysisSchema = new mongoose_1.Schema({
    positioningStrength: { type: Number, default: 0 },
    competitorComparison: [{ type: String }],
    differentiators: [{ type: String }],
    marketPosition: { type: String, default: '' },
    improvementImpact: [{ type: String }]
}, { _id: false });
const improvementItemSchema = new mongoose_1.Schema({
    priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    actions: [{ type: String }],
    estimatedImpact: { type: String, default: '' }
}, { _id: false });
const improvementPlanSchema = new mongoose_1.Schema({
    immediate: [improvementItemSchema],
    shortTerm: [improvementItemSchema],
    longTerm: [improvementItemSchema]
}, { _id: false });
const feedbackStrengthSchema = new mongoose_1.Schema({
    category: { type: String, required: true },
    points: [{ type: String }],
    impact: { type: String, default: '' }
}, { _id: false });
const feedbackWeaknessSchema = new mongoose_1.Schema({
    category: { type: String, required: true },
    points: [{ type: String }],
    impact: { type: String, default: '' },
    solutions: [{ type: String }]
}, { _id: false });
const detailedFeedbackSchema = new mongoose_1.Schema({
    strengths: [feedbackStrengthSchema],
    weaknesses: [feedbackWeaknessSchema],
    quickWins: [{ type: String }],
    industryInsights: [{ type: String }]
}, { _id: false });
const analysisResultSchema = new mongoose_1.Schema({
    overallScore: { type: Number, required: true, min: 0, max: 100 },
    matchPercentage: { type: Number, required: true, min: 0, max: 100 },
    jobTitle: { type: String, required: true },
    industry: { type: String, required: true },
    keywordMatch: keywordMatchSchema,
    skillsAnalysis: skillsAnalysisSchema,
    experienceAnalysis: experienceAnalysisSchema,
    resumeQuality: resumeQualitySchema,
    competitiveAnalysis: competitiveAnalysisSchema,
    detailedFeedback: detailedFeedbackSchema,
    improvementPlan: improvementPlanSchema,
    overallRecommendation: { type: String, default: '' },
    aiInsights: [{ type: String }],
    candidateStrengths: [{ type: String }],
    developmentAreas: [{ type: String }],
    confidence: { type: Number, default: 85, min: 0, max: 100 },
    processingTime: { type: Number }
}, { _id: false });
const analysisSchema = new mongoose_1.Schema({
    analysisId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    resumeFilename: {
        type: String,
        required: true
    },
    jobDescriptionFilename: {
        type: String,
        required: false
    },
    resumeText: {
        type: String,
        required: true
    },
    jobDescriptionText: {
        type: String,
        required: false
    },
    result: {
        type: analysisResultSchema,
        required: false
    },
    status: {
        type: String,
        enum: ['processing', 'completed', 'failed'],
        default: 'processing'
    },
    error: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date,
        required: false
    }
}, {
    timestamps: true,
    collection: 'analyses'
});
// Create indexes for better query performance
analysisSchema.index({ createdAt: -1 });
analysisSchema.index({ status: 1 });
analysisSchema.index({ 'result.overallScore': -1 });
analysisSchema.index({ 'result.industry': 1 });
analysisSchema.index({ 'result.jobTitle': 1 });
// Export the model
exports.Analysis = mongoose_1.default.model('Analysis', analysisSchema);
//# sourceMappingURL=Analysis.js.map
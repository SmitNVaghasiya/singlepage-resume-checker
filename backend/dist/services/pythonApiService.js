"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pythonApiService = void 0;
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const config_1 = require("../config/config");
const logger_1 = require("../utils/logger");
class PythonApiService {
    constructor() {
        this.client = axios_1.default.create({
            baseURL: config_1.config.pythonApiUrl,
            timeout: config_1.config.pythonApiTimeout * 2, // Increased timeout for comprehensive analysis
            headers: {
                'Accept': 'application/json',
            },
        });
        // Add request interceptor for logging
        this.client.interceptors.request.use((request) => {
            logger_1.logger.info({
                message: 'Python API request',
                method: request.method,
                url: request.url,
            });
            return request;
        }, (error) => {
            logger_1.logger.error('Python API request error:', error);
            return Promise.reject(error);
        });
        // Add response interceptor for logging
        this.client.interceptors.response.use((response) => {
            logger_1.logger.info({
                message: 'Python API response',
                status: response.status,
                url: response.config.url,
            });
            return response;
        }, (error) => {
            logger_1.logger.error({
                message: 'Python API response error',
                status: error.response?.status,
                data: error.response?.data,
            });
            return Promise.reject(error);
        });
    }
    async analyzeResume(resumeFile, jobDescriptionFile, jobDescriptionText) {
        try {
            // Create form data
            const formData = new form_data_1.default();
            // Append resume file
            formData.append('resume', resumeFile.buffer, {
                filename: resumeFile.originalname,
                contentType: resumeFile.mimetype,
            });
            // Append job description
            if (jobDescriptionFile) {
                formData.append('job_description', jobDescriptionFile.buffer, {
                    filename: jobDescriptionFile.originalname,
                    contentType: jobDescriptionFile.mimetype,
                });
            }
            else if (jobDescriptionText) {
                // Send job description text as form data field
                formData.append('job_description_text', jobDescriptionText);
            }
            // Make request to Python API
            const response = await this.client.post('/analyze', formData, {
                headers: {
                    ...formData.getHeaders(),
                },
            });
            // Check if the response is the new comprehensive format
            if (response.data.result) {
                return { result: response.data.result };
            }
            // Fallback to legacy format transformation
            const legacyResponse = response.data;
            if (legacyResponse.success && legacyResponse.analysis) {
                return { result: this.transformLegacyResponse(legacyResponse, resumeFile, jobDescriptionFile) };
            }
            throw new Error('Invalid response format from Python API');
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                if (error.response) {
                    // Python API returned an error response
                    throw new Error(error.response.data?.detail ||
                        error.response.data?.error ||
                        `Python API error: ${error.response.status}`);
                }
                else if (error.request) {
                    // Request was made but no response received
                    throw new Error('Python API is not responding');
                }
            }
            logger_1.logger.error('Resume analysis failed:', error);
            throw new Error('Failed to analyze resume');
        }
    }
    // Transform legacy response to new comprehensive format
    transformLegacyResponse(legacyResponse, resumeFile, jobDescriptionFile) {
        const analysis = legacyResponse.analysis;
        return {
            overallScore: analysis.score,
            matchPercentage: analysis.keyword_match.percentage,
            jobTitle: 'Job Position', // Default value
            industry: 'General', // Default value
            keywordMatch: {
                matched: analysis.keyword_match.matched,
                missing: analysis.keyword_match.missing,
                percentage: analysis.keyword_match.percentage,
                suggestions: analysis.suggestions.slice(0, 3) // Use first 3 suggestions
            },
            skillsAnalysis: {
                technical: {
                    required: [],
                    present: analysis.keyword_match.matched.filter(skill => this.isTechnicalSkill(skill)),
                    missing: analysis.keyword_match.missing.filter(skill => this.isTechnicalSkill(skill)),
                    recommendations: analysis.suggestions.filter(s => s.toLowerCase().includes('skill'))
                },
                soft: {
                    required: [],
                    present: analysis.strengths.filter(s => this.isSoftSkill(s)),
                    missing: [],
                    recommendations: analysis.suggestions.filter(s => s.toLowerCase().includes('communication') || s.toLowerCase().includes('leadership'))
                },
                industry: {
                    required: [],
                    present: [],
                    missing: [],
                    recommendations: []
                }
            },
            experienceAnalysis: {
                yearsRequired: 0,
                yearsFound: 0,
                relevant: true,
                experienceGaps: analysis.weaknesses.filter(w => w.toLowerCase().includes('experience')),
                strengthAreas: analysis.strengths.filter(s => s.toLowerCase().includes('experience')),
                improvementAreas: analysis.suggestions.filter(s => s.toLowerCase().includes('experience'))
            },
            resumeQuality: {
                formatting: {
                    score: Math.max(60, analysis.score - 20),
                    issues: analysis.weaknesses.filter(w => w.toLowerCase().includes('format')),
                    suggestions: analysis.suggestions.filter(s => s.toLowerCase().includes('format'))
                },
                content: {
                    score: analysis.score,
                    issues: analysis.weaknesses,
                    suggestions: analysis.suggestions
                },
                length: {
                    score: 75, // Default score
                    wordCount: legacyResponse.metadata.file_size / 5, // Rough estimate
                    recommendations: []
                },
                structure: {
                    score: Math.max(50, analysis.score - 10),
                    missingSections: [],
                    suggestions: analysis.suggestions.filter(s => s.toLowerCase().includes('section'))
                }
            },
            competitiveAnalysis: {
                positioningStrength: Math.min(analysis.score + 10, 100),
                competitorComparison: [`Your resume scores ${analysis.score}% compared to similar candidates`],
                differentiators: analysis.strengths.slice(0, 3),
                marketPosition: analysis.score > 75 ? 'Strong' : analysis.score > 50 ? 'Moderate' : 'Needs Improvement',
                improvementImpact: analysis.suggestions.map(s => `Implementing this could improve your score by 5-10%`)
            },
            detailedFeedback: {
                strengths: analysis.strengths.map(s => ({
                    category: 'General',
                    points: [s],
                    impact: 'Positive impact on application'
                })),
                weaknesses: analysis.weaknesses.map(w => ({
                    category: 'General',
                    points: [w],
                    impact: 'May reduce application effectiveness',
                    solutions: analysis.suggestions.filter(s => s.toLowerCase().includes(w.toLowerCase().split(' ')[0]))
                })),
                quickWins: analysis.suggestions.slice(0, 3),
                industryInsights: ['Consider industry-specific keywords', 'Align with current market trends']
            },
            improvementPlan: {
                immediate: analysis.suggestions.slice(0, 2).map(s => ({
                    priority: 'high',
                    actions: [s],
                    estimatedImpact: '5-10 point score improvement'
                })),
                shortTerm: analysis.suggestions.slice(2, 4).map(s => ({
                    priority: 'medium',
                    actions: [s],
                    estimatedImpact: '3-7 point score improvement'
                })),
                longTerm: analysis.suggestions.slice(4).map(s => ({
                    priority: 'low',
                    actions: [s],
                    estimatedImpact: '2-5 point score improvement'
                }))
            },
            overallRecommendation: analysis.overall_recommendation,
            aiInsights: [
                'Analysis completed using advanced AI algorithms',
                'Recommendations are based on industry best practices',
                'Consider implementing high-priority suggestions first'
            ],
            candidateStrengths: analysis.strengths,
            developmentAreas: analysis.weaknesses,
            confidence: 85 // Default confidence level
        };
    }
    // Helper method to identify technical skills
    isTechnicalSkill(skill) {
        const technicalKeywords = [
            'python', 'javascript', 'java', 'react', 'angular', 'node', 'sql', 'mongodb',
            'aws', 'docker', 'kubernetes', 'git', 'api', 'rest', 'html', 'css', 'typescript'
        ];
        return technicalKeywords.some(keyword => skill.toLowerCase().includes(keyword));
    }
    // Helper method to identify soft skills
    isSoftSkill(skill) {
        const softSkillKeywords = [
            'communication', 'leadership', 'teamwork', 'problem-solving', 'management',
            'collaboration', 'analytical', 'creative', 'adaptable', 'organized'
        ];
        return softSkillKeywords.some(keyword => skill.toLowerCase().includes(keyword));
    }
    // Health check for Python API
    async checkHealth() {
        try {
            const response = await this.client.get('/health');
            return response.status === 200;
        }
        catch (error) {
            logger_1.logger.error('Python API health check failed:', error);
            return false;
        }
    }
}
exports.pythonApiService = new PythonApiService();
//# sourceMappingURL=pythonApiService.js.map
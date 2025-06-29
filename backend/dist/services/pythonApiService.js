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
            timeout: config_1.config.pythonApiTimeout,
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
    async analyzeResume(resumeFile, jobDescriptionFile) {
        try {
            // Create form data
            const formData = new form_data_1.default();
            // Append files
            formData.append('resume', resumeFile.buffer, {
                filename: resumeFile.originalname,
                contentType: resumeFile.mimetype,
            });
            formData.append('job_description', jobDescriptionFile.buffer, {
                filename: jobDescriptionFile.originalname,
                contentType: jobDescriptionFile.mimetype,
            });
            // Make request to Python API
            const response = await this.client.post('/analyze', formData, {
                headers: {
                    ...formData.getHeaders(),
                },
            });
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                if (error.response) {
                    // Python API returned an error response
                    throw new Error(error.response.data?.message ||
                        `Python API error: ${error.response.status}`);
                }
                else if (error.request) {
                    // Request was made but no response received
                    throw new Error('Python API is not responding');
                }
            }
            throw new Error('Failed to analyze resume');
        }
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
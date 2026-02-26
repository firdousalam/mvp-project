const axios = require('axios');

class ServiceClient {
    constructor(baseURL, timeout = 5000) {
        this.baseURL = baseURL;
        this.timeout = timeout;
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: this.timeout
        });
    }

    async get(path) {
        try {
            const response = await this.client.get(path);
            return {
                success: true,
                data: response.data,
                status: response.status
            };
        } catch (error) {
            // Handle timeout errors
            if (error.code === 'ECONNABORTED') {
                return {
                    success: false,
                    error: 'Request timeout',
                    status: 503
                };
            }

            // Handle connection errors
            if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                return {
                    success: false,
                    error: 'Service unavailable',
                    status: 503
                };
            }

            // Handle HTTP error responses
            if (error.response) {
                return {
                    success: false,
                    error: error.response.data?.error?.message || error.response.statusText || 'Request failed',
                    status: error.response.status,
                    data: error.response.data
                };
            }

            // Handle other errors
            return {
                success: false,
                error: error.message || 'Unknown error',
                status: 500
            };
        }
    }

    async post(path, data) {
        try {
            const response = await this.client.post(path, data);
            return {
                success: true,
                data: response.data,
                status: response.status
            };
        } catch (error) {
            // Handle timeout errors
            if (error.code === 'ECONNABORTED') {
                return {
                    success: false,
                    error: 'Request timeout',
                    status: 503
                };
            }

            // Handle connection errors
            if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                return {
                    success: false,
                    error: 'Service unavailable',
                    status: 503
                };
            }

            // Handle HTTP error responses
            if (error.response) {
                return {
                    success: false,
                    error: error.response.data?.error?.message || error.response.statusText || 'Request failed',
                    status: error.response.status,
                    data: error.response.data
                };
            }

            // Handle other errors
            return {
                success: false,
                error: error.message || 'Unknown error',
                status: 500
            };
        }
    }
}

// Create service client instances
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';

const userServiceClient = new ServiceClient(USER_SERVICE_URL);
const productServiceClient = new ServiceClient(PRODUCT_SERVICE_URL);

module.exports = {
    ServiceClient,
    userServiceClient,
    productServiceClient
};

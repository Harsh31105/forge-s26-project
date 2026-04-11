import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import axios from "axios";

interface RetryAxiosRequestConfig extends AxiosRequestConfig {
    _retry?: boolean;
};

const forceLogout = () => {
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
    }
};

export const TOKEN_KEY = "auth_token";

const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
            config.headers = config.headers ?? {};
            config.headers["Authorization"] = `Bearer ${token}`;
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
})

let isRetrying = false;

apiClient.interceptors.response.use(
    response => response,
    async (error) => {
        const status = error.response?.status;
        const config = error.config as RetryAxiosRequestConfig;

        if (status === 401) {
            if (!config._retry) {
                config._retry = true;

                try {
                    return await apiClient.request(config);
                } catch (retryError) {
                    forceLogout();
                }
            } else {
                forceLogout();
            }
        } else if (status === 403) {
            console.error("Forbidden Access");
        } else if (status === 404) {
            console.error("Resource not found");
        } else if (status >= 500) {
            console.error("Server error occurred");
        } else {
            console.error("An error occurred: ", error.message)
        }

        return Promise.reject(error)
    },
);

export function customAxios<T>(config: AxiosRequestConfig): Promise<T> {
    return apiClient(config).then((response: AxiosResponse<T>) => response.data);
}
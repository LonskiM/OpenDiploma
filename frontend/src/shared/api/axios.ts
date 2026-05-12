import axios from "axios";

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000",
    // We use Bearer token auth, cookies are not required.
    // Keeping this false avoids browser CORS credential restrictions.
    withCredentials: false,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error?.response?.status === 401) {
            localStorage.removeItem("token");
        }

        return Promise.reject(error);
    }
);
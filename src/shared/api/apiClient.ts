import axios from "axios";

export const apiClient = axios.create({
  baseURL: "http://localhost:5059/api",
});

apiClient.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem(
        "maizevision_token"
      );

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
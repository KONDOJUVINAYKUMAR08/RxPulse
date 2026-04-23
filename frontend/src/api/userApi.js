import axiosInstance from '../utils/axiosInstance';

export const registerUser = (data) => axiosInstance.post('/api/users/register', data);
export const loginUser = (data) => axiosInstance.post('/api/users/login', data);
export const getProfile = () => axiosInstance.get('/api/users/profile');
export const updateProfile = (data) => axiosInstance.put('/api/users/profile', data);
export const verifyToken = () => axiosInstance.get('/api/users/verify');

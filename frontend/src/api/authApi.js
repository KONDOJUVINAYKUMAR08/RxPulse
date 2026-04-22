import axiosInstance from '../utils/axiosInstance';

export const login = (data) => axiosInstance.post('/api/auth/login', data);
export const getProfile = () => axiosInstance.get('/api/auth/profile');
export const updateProfile = (data) => axiosInstance.put('/api/auth/profile', data);
export const getAllUsers = () => axiosInstance.get('/api/auth/users');
export const updateUser = (id, data) => axiosInstance.put(`/api/auth/users/${id}`, data);
export const deleteUser = (id) => axiosInstance.delete(`/api/auth/users/${id}`);
export const registerUser = (data) => axiosInstance.post('/api/auth/register', data);

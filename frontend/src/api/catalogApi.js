import axiosInstance from '../utils/axiosInstance';

export const getMedicines = (params) => axiosInstance.get('/api/catalog/medicines', { params });
export const getMedicineById = (id) => axiosInstance.get(`/api/catalog/medicines/${id}`);
export const searchMedicines = (q) => axiosInstance.get('/api/catalog/medicines/search', { params: { q } });
export const getExpiringMedicines = () => axiosInstance.get('/api/catalog/medicines/expiring');
export const getCategories = () => axiosInstance.get('/api/catalog/categories');
export const createMedicine = (data) => axiosInstance.post('/api/catalog/medicines', data);
export const updateMedicine = (id, data) => axiosInstance.put(`/api/catalog/medicines/${id}`, data);
export const deleteMedicine = (id) => axiosInstance.delete(`/api/catalog/medicines/${id}`);
export const createCategory = (data) => axiosInstance.post('/api/catalog/categories', data);

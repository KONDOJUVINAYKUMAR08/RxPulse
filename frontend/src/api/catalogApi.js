import axiosInstance from '../utils/axiosInstance';

export const getAllMedicines = (params) => axiosInstance.get('/api/catalog/medicines', { params });
export const searchMedicines = (q) => axiosInstance.get('/api/catalog/medicines/search', { params: { q } });
export const getExpiringMedicines = (days = 30) => axiosInstance.get('/api/catalog/medicines/expiring', { params: { days } });
export const getMedicineById = (id) => axiosInstance.get(`/api/catalog/medicines/${id}`);
export const createMedicine = (data) => axiosInstance.post('/api/catalog/medicines', data);
export const updateMedicine = (id, data) => axiosInstance.put(`/api/catalog/medicines/${id}`, data);
export const deleteMedicine = (id) => axiosInstance.delete(`/api/catalog/medicines/${id}`);

export const getAllCategories = () => axiosInstance.get('/api/catalog/categories');
export const createCategory = (data) => axiosInstance.post('/api/catalog/categories', data);
export const deleteCategory = (id) => axiosInstance.delete(`/api/catalog/categories/${id}`);

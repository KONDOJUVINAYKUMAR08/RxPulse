import axiosInstance from '../utils/axiosInstance';

export const getAllStocks = () => axiosInstance.get('/api/inventory/stocks');
export const getStockByMedicineId = (id) => axiosInstance.get(`/api/inventory/stocks/${id}`);
export const stockIn = (data) => axiosInstance.post('/api/inventory/stocks/stock-in', data);
export const stockOut = (data) => axiosInstance.post('/api/inventory/stocks/stock-out', data);
export const updateThreshold = (id, threshold) => axiosInstance.put(`/api/inventory/stocks/${id}/threshold`, { threshold });

export const getMovements = (params) => axiosInstance.get('/api/inventory/movements', { params });

export const getAllAlerts = (params) => axiosInstance.get('/api/inventory/alerts', { params });
export const getActiveAlerts = () => axiosInstance.get('/api/inventory/alerts/active');
export const resolveAlert = (id) => axiosInstance.put(`/api/inventory/alerts/${id}/resolve`);

export const getMonthlyReport = (year, month) => axiosInstance.get('/api/inventory/alerts/reports/monthly', { params: { year, month } });
export const getStats = () => axiosInstance.get('/api/inventory/alerts/reports/stats');

import axiosInstance from '../utils/axiosInstance';

export const getStocks = () => axiosInstance.get('/api/inventory/stocks');
export const getStockByMedicineId = (medicineId) => axiosInstance.get(`/api/inventory/stocks/${medicineId}`);
export const stockIn = (data) => axiosInstance.post('/api/inventory/stocks/stock-in', data);
export const stockOut = (data) => axiosInstance.post('/api/inventory/stocks/stock-out', data);
export const updateThreshold = (id, data) => axiosInstance.put(`/api/inventory/stocks/${id}/threshold`, data);
export const getMovements = () => axiosInstance.get('/api/inventory/movements');
export const getAlerts = () => axiosInstance.get('/api/inventory/alerts');
export const getActiveAlerts = () => axiosInstance.get('/api/inventory/alerts/active');
export const resolveAlert = (id) => axiosInstance.put(`/api/inventory/alerts/${id}/resolve`);
export const getMonthlyReport = () => axiosInstance.get('/api/inventory/reports/monthly');
export const getStats = () => axiosInstance.get('/api/inventory/reports/stats');
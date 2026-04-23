require('dotenv').config();
const mongoose = require('mongoose');
const Stock = require('./models/Stock');
const Movement = require('./models/Movement');
const Alert = require('./models/Alert');

const MONGO_URI = process.env.MONGO_URI 
  || 'mongodb://mongo-inventory:27017/inventory_db';

const stocksData = [
  { medicineName: 'Paracetamol 500mg', category: 'Painkillers', currentQuantity: 450, unit: 'tablets', threshold: 50, location: 'Shelf B1', isLowStock: false },
  { medicineName: 'Amoxicillin 500mg', category: 'Antibiotics', currentQuantity: 150, unit: 'capsules', threshold: 30, location: 'Shelf A1', isLowStock: false },
  { medicineName: 'Azithromycin 250mg', category: 'Antibiotics', currentQuantity: 80, unit: 'tablets', threshold: 20, location: 'Shelf A2', isLowStock: false },
  { medicineName: 'Ibuprofen 400mg', category: 'Painkillers', currentQuantity: 200, unit: 'tablets', threshold: 40, location: 'Shelf B2', isLowStock: false },
  { medicineName: 'Vitamin C 500mg', category: 'Vitamins', currentQuantity: 300, unit: 'tablets', threshold: 50, location: 'Shelf C1', isLowStock: false },
  { medicineName: 'Vitamin D3 1000IU', category: 'Vitamins', currentQuantity: 8, unit: 'capsules', threshold: 30, location: 'Shelf C2', isLowStock: true },
  { medicineName: 'Multivitamin Daily', category: 'Vitamins', currentQuantity: 120, unit: 'tablets', threshold: 25, location: 'Shelf C3', isLowStock: false },
  { medicineName: 'Metformin 500mg', category: 'Antidiabetics', currentQuantity: 250, unit: 'tablets', threshold: 50, location: 'Shelf D1', isLowStock: false },
  { medicineName: 'Glipizide 5mg', category: 'Antidiabetics', currentQuantity: 5, unit: 'tablets', threshold: 20, location: 'Shelf D2', isLowStock: true },
  { medicineName: 'Amlodipine 5mg', category: 'Antihypertensives', currentQuantity: 180, unit: 'tablets', threshold: 30, location: 'Shelf E1', isLowStock: false },
  { medicineName: 'Atenolol 50mg', category: 'Antihypertensives', currentQuantity: 15, unit: 'tablets', threshold: 30, location: 'Shelf E2', isLowStock: true },
  { medicineName: 'Omeprazole 20mg', category: 'Antacids', currentQuantity: 160, unit: 'capsules', threshold: 30, location: 'Shelf F1', isLowStock: false },
  { medicineName: 'Pantoprazole 40mg', category: 'Antacids', currentQuantity: 75, unit: 'tablets', threshold: 20, location: 'Shelf F2', isLowStock: false },
  { medicineName: 'Cetirizine 10mg', category: 'Antihistamines', currentQuantity: 200, unit: 'tablets', threshold: 30, location: 'Shelf G1', isLowStock: false },
  { medicineName: 'Loratadine 10mg', category: 'Antihistamines', currentQuantity: 10, unit: 'tablets', threshold: 25, location: 'Shelf G2', isLowStock: true },
  { medicineName: 'Cough Syrup 100ml', category: 'Syrups', currentQuantity: 45, unit: 'ml', threshold: 15, location: 'Shelf H1', isLowStock: false },
  { medicineName: 'Antacid Suspension 170ml', category: 'Antacids', currentQuantity: 30, unit: 'ml', threshold: 10, location: 'Shelf H2', isLowStock: false },
  { medicineName: 'Ciprofloxacin 500mg', category: 'Antibiotics', currentQuantity: 3, unit: 'tablets', threshold: 20, location: 'Shelf A3', isLowStock: true },
  { medicineName: 'Aspirin 75mg', category: 'Painkillers', currentQuantity: 400, unit: 'tablets', threshold: 60, location: 'Shelf B4', isLowStock: false },
  { medicineName: 'Diclofenac 50mg', category: 'Painkillers', currentQuantity: 12, unit: 'tablets', threshold: 25, location: 'Shelf B3', isLowStock: true },
];

const alertsData = [
  { medicineName: 'Vitamin D3 1000IU', alertType: 'LOW_STOCK', message: 'Vitamin D3 1000IU critically low. Only 8 units left. Threshold: 30.', severity: 'CRITICAL', isResolved: false },
  { medicineName: 'Glipizide 5mg', alertType: 'LOW_STOCK', message: 'Glipizide 5mg critically low. Only 5 units left. Threshold: 20.', severity: 'CRITICAL', isResolved: false },
  { medicineName: 'Atenolol 50mg', alertType: 'LOW_STOCK', message: 'Atenolol 50mg low. Only 15 units left. Threshold: 30.', severity: 'WARNING', isResolved: false },
  { medicineName: 'Loratadine 10mg', alertType: 'LOW_STOCK', message: 'Loratadine 10mg low. Only 10 units left. Threshold: 25.', severity: 'WARNING', isResolved: false },
  { medicineName: 'Ciprofloxacin 500mg', alertType: 'LOW_STOCK', message: 'Ciprofloxacin 500mg critically low. Only 3 units left.', severity: 'CRITICAL', isResolved: false },
  { medicineName: 'Ciprofloxacin 500mg', alertType: 'EXPIRY', message: 'Ciprofloxacin 500mg expires on 30 Apr 2026.', severity: 'CRITICAL', isResolved: false },
  { medicineName: 'Atenolol 50mg', alertType: 'EXPIRY', message: 'Atenolol 50mg expires on 01 May 2026.', severity: 'WARNING', isResolved: false },
  { medicineName: 'Diclofenac 50mg', alertType: 'LOW_STOCK', message: 'Diclofenac 50mg low. Only 12 units left. Threshold: 25.', severity: 'WARNING', isResolved: false },
];

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[inventory-service] Connected to inventory_db');

    await Stock.deleteMany({});
    await Movement.deleteMany({});
    await Alert.deleteMany({});
    console.log('[inventory-service] Cleared existing inventory data');

    // Build stocks with medicineId = medicineName
    // (using medicineName as medicineId since no cross-DB reference)
    const stocksToInsert = stocksData.map((s) => ({
      medicineId: s.medicineName,
      medicineName: s.medicineName,
      category: s.category,
      currentQuantity: s.currentQuantity,
      unit: s.unit,
      threshold: s.threshold,
      location: s.location,
      isLowStock: s.isLowStock,
      lastUpdated: new Date(),
    }));

    await Stock.insertMany(stocksToInsert);
    console.log(`[inventory-service] Inserted ${stocksToInsert.length} stock records`);

    const now = Date.now();
    const movementsToInsert = [
      { medicineId: 'Paracetamol 500mg', medicineName: 'Paracetamol 500mg', type: 'STOCK_IN', quantity: 500, reason: 'Monthly restock', supplierName: 'MedCorp India', performedBy: 'admin', performedByName: 'Admin User', date: new Date(now - 20 * 24 * 60 * 60 * 1000) },
      { medicineId: 'Paracetamol 500mg', medicineName: 'Paracetamol 500mg', type: 'STOCK_OUT', quantity: 50, reason: 'Customer orders', performedBy: 'admin', performedByName: 'Admin User', date: new Date(now - 15 * 24 * 60 * 60 * 1000) },
      { medicineId: 'Amoxicillin 500mg', medicineName: 'Amoxicillin 500mg', type: 'STOCK_IN', quantity: 200, reason: 'New stock', supplierName: 'Sun Pharma', performedBy: 'admin', performedByName: 'Admin User', date: new Date(now - 18 * 24 * 60 * 60 * 1000) },
      { medicineId: 'Ibuprofen 400mg', medicineName: 'Ibuprofen 400mg', type: 'STOCK_IN', quantity: 250, reason: 'Regular restock', supplierName: 'Dr Reddys', performedBy: 'admin', performedByName: 'Admin User', date: new Date(now - 10 * 24 * 60 * 60 * 1000) },
      { medicineId: 'Vitamin C 500mg', medicineName: 'Vitamin C 500mg', type: 'STOCK_IN', quantity: 400, reason: 'Seasonal demand', supplierName: 'Himalaya', performedBy: 'admin', performedByName: 'Admin User', date: new Date(now - 12 * 24 * 60 * 60 * 1000) },
      { medicineId: 'Metformin 500mg', medicineName: 'Metformin 500mg', type: 'STOCK_IN', quantity: 300, reason: 'Quarterly restock', supplierName: 'Sun Pharma', performedBy: 'admin', performedByName: 'Admin User', date: new Date(now - 8 * 24 * 60 * 60 * 1000) },
      { medicineId: 'Cetirizine 10mg', medicineName: 'Cetirizine 10mg', type: 'STOCK_IN', quantity: 250, reason: 'Allergy season', supplierName: 'Abbott', performedBy: 'admin', performedByName: 'Admin User', date: new Date(now - 5 * 24 * 60 * 60 * 1000) },
      { medicineId: 'Omeprazole 20mg', medicineName: 'Omeprazole 20mg', type: 'STOCK_IN', quantity: 200, reason: 'Regular restock', supplierName: 'Cipla', performedBy: 'admin', performedByName: 'Admin User', date: new Date(now - 3 * 24 * 60 * 60 * 1000) },
    ];

    await Movement.insertMany(movementsToInsert);
    console.log(`[inventory-service] Inserted ${movementsToInsert.length} movement records`);

    const alertsToInsert = alertsData.map((a) => ({
      medicineId: a.medicineName,
      medicineName: a.medicineName,
      alertType: a.alertType,
      message: a.message,
      severity: a.severity,
      isResolved: a.isResolved,
    }));

    await Alert.insertMany(alertsToInsert);
    console.log(`[inventory-service] Inserted ${alertsToInsert.length} alert records`);

    console.log('[inventory-service] Inventory seed completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('[inventory-service] Seed failed:', err.message);
    process.exit(1);
  }
};

seed();

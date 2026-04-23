require('dotenv').config();
const mongoose = require('mongoose');
const Stock = require('./models/Stock');
const Movement = require('./models/Movement');
const Alert = require('./models/Alert');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo-inventory:27017/inventory_db';

const stocks = [
  { medicineId: 'BATCH-AMX-001', medicineName: 'Amoxicillin 500mg', category: 'Antibiotics', currentQuantity: 150, unit: 'capsules', threshold: 30, location: 'Shelf A1', isLowStock: false },
  { medicineId: 'BATCH-AZI-002', medicineName: 'Azithromycin 250mg', category: 'Antibiotics', currentQuantity: 80, unit: 'tablets', threshold: 20, location: 'Shelf A2', isLowStock: false },
  { medicineId: 'BATCH-CIP-019', medicineName: 'Ciprofloxacin 500mg', category: 'Antibiotics', currentQuantity: 3, unit: 'tablets', threshold: 20, location: 'Shelf A3', isLowStock: true },
  { medicineId: 'BATCH-PCM-003', medicineName: 'Paracetamol 500mg', category: 'Painkillers', currentQuantity: 8, unit: 'tablets', threshold: 50, location: 'Shelf B1', isLowStock: true },
  { medicineId: 'BATCH-IBU-004', medicineName: 'Ibuprofen 400mg', category: 'Painkillers', currentQuantity: 200, unit: 'tablets', threshold: 40, location: 'Shelf B2', isLowStock: false },
  { medicineId: 'BATCH-DCF-005', medicineName: 'Diclofenac 50mg', category: 'Painkillers', currentQuantity: 12, unit: 'tablets', threshold: 25, location: 'Shelf B3', isLowStock: true },
  { medicineId: 'BATCH-ASP-020', medicineName: 'Aspirin 75mg', category: 'Painkillers', currentQuantity: 400, unit: 'tablets', threshold: 60, location: 'Shelf B4', isLowStock: false },
  { medicineId: 'BATCH-VTC-006', medicineName: 'Vitamin C 500mg', category: 'Vitamins', currentQuantity: 300, unit: 'tablets', threshold: 50, location: 'Shelf C1', isLowStock: false },
  { medicineId: 'BATCH-VTD-007', medicineName: 'Vitamin D3 1000IU', category: 'Vitamins', currentQuantity: 5, unit: 'capsules', threshold: 30, location: 'Shelf C2', isLowStock: true },
  { medicineId: 'BATCH-MTV-008', medicineName: 'Multivitamin Tablet', category: 'Vitamins', currentQuantity: 120, unit: 'tablets', threshold: 25, location: 'Shelf C3', isLowStock: false },
  { medicineId: 'BATCH-MET-009', medicineName: 'Metformin 500mg', category: 'Antidiabetics', currentQuantity: 250, unit: 'tablets', threshold: 50, location: 'Shelf D1', isLowStock: false },
  { medicineId: 'BATCH-GLP-010', medicineName: 'Glipizide 5mg', category: 'Antidiabetics', currentQuantity: 90, unit: 'tablets', threshold: 20, location: 'Shelf D2', isLowStock: false },
  { medicineId: 'BATCH-AML-011', medicineName: 'Amlodipine 5mg', category: 'Antihypertensives', currentQuantity: 180, unit: 'tablets', threshold: 30, location: 'Shelf E1', isLowStock: false },
  { medicineId: 'BATCH-ATN-012', medicineName: 'Atenolol 50mg', category: 'Antihypertensives', currentQuantity: 15, unit: 'tablets', threshold: 30, location: 'Shelf E2', isLowStock: true },
  { medicineId: 'BATCH-OMP-013', medicineName: 'Omeprazole 20mg', category: 'Antacids', currentQuantity: 160, unit: 'capsules', threshold: 30, location: 'Shelf F1', isLowStock: false },
  { medicineId: 'BATCH-PAN-014', medicineName: 'Pantoprazole 40mg', category: 'Antacids', currentQuantity: 75, unit: 'tablets', threshold: 20, location: 'Shelf F2', isLowStock: false },
  { medicineId: 'BATCH-CTZ-015', medicineName: 'Cetirizine 10mg', category: 'Antihistamines', currentQuantity: 200, unit: 'tablets', threshold: 30, location: 'Shelf G1', isLowStock: false },
  { medicineId: 'BATCH-LOR-016', medicineName: 'Loratadine 10mg', category: 'Antihistamines', currentQuantity: 10, unit: 'tablets', threshold: 25, location: 'Shelf G2', isLowStock: true },
  { medicineId: 'BATCH-CSY-017', medicineName: 'Cough Syrup 100ml', category: 'Syrups', currentQuantity: 45, unit: 'ml', threshold: 15, location: 'Shelf H1', isLowStock: false },
  { medicineId: 'BATCH-ASY-018', medicineName: 'Antacid Suspension 170ml', category: 'Syrups', currentQuantity: 30, unit: 'ml', threshold: 10, location: 'Shelf H2', isLowStock: false },
];

const movements = [
  { medicineId: 'BATCH-PCM-003', medicineName: 'Paracetamol 500mg', type: 'STOCK_IN', quantity: 200, reason: 'Monthly restock', supplierName: 'MedCorp Pharma', batchNumber: 'BATCH-PCM-003', performedBy: 'admin', performedByName: 'Admin User', date: new Date(Date.now() - 25*86400000) },
  { medicineId: 'BATCH-PCM-003', medicineName: 'Paracetamol 500mg', type: 'STOCK_OUT', quantity: 192, reason: 'Dispensed to patients', performedBy: 'admin', performedByName: 'Admin User', date: new Date(Date.now() - 20*86400000) },
  { medicineId: 'BATCH-AMX-001', medicineName: 'Amoxicillin 500mg', type: 'STOCK_IN', quantity: 200, reason: 'New stock received', supplierName: 'Sun Pharma', batchNumber: 'BATCH-AMX-001', performedBy: 'admin', performedByName: 'Admin User', date: new Date(Date.now() - 15*86400000) },
  { medicineId: 'BATCH-AMX-001', medicineName: 'Amoxicillin 500mg', type: 'STOCK_OUT', quantity: 50, reason: 'Dispensed', performedBy: 'admin', performedByName: 'Admin User', date: new Date(Date.now() - 10*86400000) },
  { medicineId: 'BATCH-MET-009', medicineName: 'Metformin 500mg', type: 'STOCK_IN', quantity: 300, reason: 'Quarterly restock', supplierName: 'Sun Pharma', batchNumber: 'BATCH-MET-009', performedBy: 'admin', performedByName: 'Admin User', date: new Date(Date.now() - 12*86400000) },
  { medicineId: 'BATCH-MET-009', medicineName: 'Metformin 500mg', type: 'STOCK_OUT', quantity: 50, reason: 'Dispensed', performedBy: 'admin', performedByName: 'Admin User', date: new Date(Date.now() - 8*86400000) },
  { medicineId: 'BATCH-VTC-006', medicineName: 'Vitamin C 500mg', type: 'STOCK_IN', quantity: 400, reason: 'Seasonal demand', supplierName: 'Himalaya', batchNumber: 'BATCH-VTC-006', performedBy: 'admin', performedByName: 'Admin User', date: new Date(Date.now() - 7*86400000) },
  { medicineId: 'BATCH-VTC-006', medicineName: 'Vitamin C 500mg', type: 'STOCK_OUT', quantity: 100, reason: 'Dispensed', performedBy: 'admin', performedByName: 'Admin User', date: new Date(Date.now() - 5*86400000) },
  { medicineId: 'BATCH-IBU-004', medicineName: 'Ibuprofen 400mg', type: 'STOCK_IN', quantity: 250, reason: 'Regular restock', supplierName: 'Dr Reddys', batchNumber: 'BATCH-IBU-004', performedBy: 'admin', performedByName: 'Admin User', date: new Date(Date.now() - 6*86400000) },
  { medicineId: 'BATCH-IBU-004', medicineName: 'Ibuprofen 400mg', type: 'STOCK_OUT', quantity: 50, reason: 'Dispensed', performedBy: 'admin', performedByName: 'Admin User', date: new Date(Date.now() - 3*86400000) },
  { medicineId: 'BATCH-AML-011', medicineName: 'Amlodipine 5mg', type: 'STOCK_IN', quantity: 200, reason: 'Monthly restock', supplierName: 'Dr Reddys', batchNumber: 'BATCH-AML-011', performedBy: 'admin', performedByName: 'Admin User', date: new Date(Date.now() - 4*86400000) },
  { medicineId: 'BATCH-AML-011', medicineName: 'Amlodipine 5mg', type: 'STOCK_OUT', quantity: 20, reason: 'Dispensed', performedBy: 'admin', performedByName: 'Admin User', date: new Date(Date.now() - 2*86400000) },
  { medicineId: 'BATCH-CTZ-015', medicineName: 'Cetirizine 10mg', type: 'STOCK_IN', quantity: 250, reason: 'Allergy season', supplierName: 'Abbott', batchNumber: 'BATCH-CTZ-015', performedBy: 'admin', performedByName: 'Admin User', date: new Date(Date.now() - 3*86400000) },
  { medicineId: 'BATCH-CTZ-015', medicineName: 'Cetirizine 10mg', type: 'STOCK_OUT', quantity: 50, reason: 'Dispensed', performedBy: 'admin', performedByName: 'Admin User', date: new Date(Date.now() - 1*86400000) },
  { medicineId: 'BATCH-OMP-013', medicineName: 'Omeprazole 20mg', type: 'STOCK_IN', quantity: 200, reason: 'Regular restock', supplierName: 'Cipla', batchNumber: 'BATCH-OMP-013', performedBy: 'admin', performedByName: 'Admin User', date: new Date(Date.now() - 2*86400000) },
  { medicineId: 'BATCH-OMP-013', medicineName: 'Omeprazole 20mg', type: 'STOCK_OUT', quantity: 40, reason: 'Dispensed', performedBy: 'admin', performedByName: 'Admin User', date: new Date(Date.now() - 1*86400000) },
];

const alerts = [
  { medicineId: 'BATCH-PCM-003', medicineName: 'Paracetamol 500mg', alertType: 'LOW_STOCK', message: 'Paracetamol 500mg critically low. Only 8 units. Threshold: 50.', severity: 'CRITICAL', isResolved: false },
  { medicineId: 'BATCH-DCF-005', medicineName: 'Diclofenac 50mg', alertType: 'LOW_STOCK', message: 'Diclofenac 50mg low. Only 12 units. Threshold: 25.', severity: 'CRITICAL', isResolved: false },
  { medicineId: 'BATCH-VTD-007', medicineName: 'Vitamin D3 1000IU', alertType: 'LOW_STOCK', message: 'Vitamin D3 critically low. Only 5 units. Threshold: 30.', severity: 'CRITICAL', isResolved: false },
  { medicineId: 'BATCH-ATN-012', medicineName: 'Atenolol 50mg', alertType: 'LOW_STOCK', message: 'Atenolol 50mg low. Only 15 units. Threshold: 30.', severity: 'WARNING', isResolved: false },
  { medicineId: 'BATCH-LOR-016', medicineName: 'Loratadine 10mg', alertType: 'LOW_STOCK', message: 'Loratadine 10mg low. Only 10 units. Threshold: 25.', severity: 'WARNING', isResolved: false },
  { medicineId: 'BATCH-CIP-019', medicineName: 'Ciprofloxacin 500mg', alertType: 'LOW_STOCK', message: 'Ciprofloxacin critically low. Only 3 units. Threshold: 20.', severity: 'CRITICAL', isResolved: false },
  { medicineId: 'BATCH-CIP-019', medicineName: 'Ciprofloxacin 500mg', alertType: 'EXPIRY', message: 'Ciprofloxacin expires 30 Apr 2026. 8 days remaining.', severity: 'CRITICAL', isResolved: false },
  { medicineId: 'BATCH-ATN-012', medicineName: 'Atenolol 50mg', alertType: 'EXPIRY', message: 'Atenolol expires 01 May 2026. Plan accordingly.', severity: 'WARNING', isResolved: false },
];

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to inventory_db');
    await Stock.deleteMany({});
    await Movement.deleteMany({});
    await Alert.deleteMany({});
    console.log('Cleared existing data');
    await Stock.insertMany(stocks);
    console.log('Inserted ' + stocks.length + ' stocks');
    await Movement.insertMany(movements);
    console.log('Inserted ' + movements.length + ' movements');
    await Alert.insertMany(alerts);
    console.log('Inserted ' + alerts.length + ' alerts');
    console.log('Inventory seed completed');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
};

seed();

import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import StockInForm from '../../components/inventory/StockInForm';

const StockIn = () => {
  const [searchParams] = useSearchParams();
  const medicineId = searchParams.get('medicineId');
  const medicineName = searchParams.get('medicineName');

  return (
    <div>
      <Navbar
        title="Stock In"
        subtitle="Record incoming medicine stock"
      />
      <div className="page-container">
        <StockInForm
          preSelectedMedicineId={medicineId}
          preSelectedMedicineName={medicineName}
        />
      </div>
    </div>
  );
};

export default StockIn;
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import StockOutForm from '../../components/inventory/StockOutForm';

const StockOut = () => {
  const [searchParams] = useSearchParams();
  const medicineId = searchParams.get('medicineId');
  const medicineName = searchParams.get('medicineName');

  return (
    <div>
      <Navbar
        title="Stock Out"
        subtitle="Record dispensed medicine stock"
      />
      <div className="page-container">
        <StockOutForm
          preSelectedMedicineId={medicineId}
          preSelectedMedicineName={medicineName}
        />
      </div>
    </div>
  );
};

export default StockOut;
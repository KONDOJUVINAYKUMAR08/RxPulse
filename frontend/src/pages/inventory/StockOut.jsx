import React from 'react';
import Navbar from '../../components/common/Navbar';
import StockOutForm from '../../components/inventory/StockOutForm';

const StockOut = () => (
  <div>
    <Navbar title="Stock Out" subtitle="Record dispensed medicine stock" />
    <div className="page-container">
      <StockOutForm />
    </div>
  </div>
);

export default StockOut;

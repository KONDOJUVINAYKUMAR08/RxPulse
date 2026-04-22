import React from 'react';
import Navbar from '../../components/common/Navbar';
import StockInForm from '../../components/inventory/StockInForm';

const StockIn = () => (
  <div>
    <Navbar title="Stock In" subtitle="Record incoming medicine stock" />
    <div className="page-container">
      <StockInForm />
    </div>
  </div>
);

export default StockIn;

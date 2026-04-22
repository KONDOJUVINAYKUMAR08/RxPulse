import React from 'react';

const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizes[size]} border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin`}
      />
      {text && <p className="text-sm text-slate-500">{text}</p>}
    </div>
  );
};

export const FullPageSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <LoadingSpinner size="lg" />
  </div>
);

export default LoadingSpinner;

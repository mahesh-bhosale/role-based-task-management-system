import React from 'react';

export const PageWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300 ${className}`}>
      {children}
    </div>
  );
};

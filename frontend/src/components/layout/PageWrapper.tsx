import React from 'react';

export const PageWrapper: React.FC<{ children: React.ReactNode; className?: string; title?: string; description?: string }> = ({ 
  children, 
  className = '',
  title,
  description
}) => {
  return (
    <div className={`p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300 ${className}`}>
      {(title || description) && (
        <div className="mb-6">
          {title && <h1 className="text-2xl font-bold text-slate-100">{title}</h1>}
          {description && <p className="text-slate-400 mt-1">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
};

import React from 'react';

interface AdminContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const AdminContainer: React.FC<AdminContainerProps> = ({ children, className = '' }) => {
  return (
    <div className={`w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 ${className}`}>
      {children}
    </div>
  );
};

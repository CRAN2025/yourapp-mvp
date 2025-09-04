import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function Container({ children, className = '' }: ContainerProps) {
  return (
    <div className={`max-w-[1200px] md:max-w-[1280px] mx-auto px-6 ${className}`}>
      {children}
    </div>
  );
}
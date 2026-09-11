import React, { useState } from 'react';
import { School } from 'lucide-react';

interface SchoolLogoProps {
  className?: string;
  imgClassName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  alt?: string;
}

export const SchoolLogo: React.FC<SchoolLogoProps> = ({
  className = '',
  imgClassName = '',
  size = 'md',
  alt = 'Logo SMK Muhammadiyah Bawang',
}) => {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-700 to-indigo-900 text-white shadow-xs ${sizeClasses[size]} ${className}`}
      >
        <School className="w-1/2 h-1/2 text-white" />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 overflow-hidden ${sizeClasses[size]} ${className}`}
    >
      <img
        src="/logo-smk.png"
        alt={alt}
        onError={() => setHasError(true)}
        className={`w-full h-full object-contain drop-shadow-xs ${imgClassName}`}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

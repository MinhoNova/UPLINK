import React from 'react';
import { getClassIcon } from '../data/character-icons';

interface ClassIconProps {
  className?: string;
  size?: number;
}

export const ClassIcon: React.FC<ClassIconProps> = ({ className, size = 16 }) => {
  if (!className) return null;
  
  const iconUrl = getClassIcon(className);
  
  if (!iconUrl) return null;

  return (
    <img 
      src={iconUrl} 
      alt={className}
      title={className}
      className="inline-block object-contain bg-transparent !bg-transparent"
      style={{ 
        width: `${size}px`, 
        height: `${size}px`,
        backgroundColor: 'transparent'
      }}
    />
  );
};

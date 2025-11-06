'use client';

import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, icon, children }) {
  if (!isOpen) return null;

  return (
    
      <div 
        className="bg-white rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        
          ×
        
        
        
          {title}
          {icon}
        
        
        
          {children}
        
      </div>
    
  );
}
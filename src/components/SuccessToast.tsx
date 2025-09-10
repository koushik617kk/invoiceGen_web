import React, { useEffect } from 'react';

interface SuccessToastProps {
  message: string;
  isVisible: boolean;
  onHide: () => void;
}

export default function SuccessToast({ message, isVisible, onHide }: SuccessToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onHide();
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onHide]);

  if (!isVisible) return null;

  return (
    <div className="success-toast">
      <div className="success-toast-content">
        <span className="success-icon">✅</span>
        <span className="success-message">{message}</span>
      </div>
    </div>
  );
}

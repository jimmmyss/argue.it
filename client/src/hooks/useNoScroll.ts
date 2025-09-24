import { useEffect } from 'react';

/**
 * Custom hook to disable scrolling on the document body
 * Useful for modal-like pages where scrolling should be prevented
 */
export const useNoScroll = () => {
  useEffect(() => {
    // Store original overflow values
    const originalStyle = {
      overflow: document.body.style.overflow,
      height: document.body.style.height,
    };
    
    // Disable scrolling
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    
    // Cleanup function to restore original scrolling
    return () => {
      document.body.style.overflow = originalStyle.overflow;
      document.body.style.height = originalStyle.height;
    };
  }, []);
};


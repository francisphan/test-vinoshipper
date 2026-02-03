import { useState, useCallback } from 'react';

export const useConfiguration = () => {
  const [isConfigured, setIsConfigured] = useState(false);

  return {
    isConfigured,
    setIsConfigured,
  };
};

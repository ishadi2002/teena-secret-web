import React, { createContext, useContext, useState, useEffect } from 'react';
import GlobalLoader from '../components/GlobalLoader';

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [activeRequests, setActiveRequests] = useState(0);

  useEffect(() => {
    // Save original fetch
    const originalFetch = window.fetch;

    // Patch global fetch automatically
    window.fetch = async (...args) => {
      setActiveRequests((prev) => prev + 1);
      try {
        const response = await originalFetch(...args);
        return response;
      } finally {
        setActiveRequests((prev) => Math.max(0, prev - 1));
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading: activeRequests > 0 }}>
      {children}
      {activeRequests > 0 && <GlobalLoader />}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);
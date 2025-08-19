import React, { createContext, useContext, useState } from 'react';

const BacktestContext = createContext();

export const useBacktest = () => {
  const context = useContext(BacktestContext);
  if (!context) {
    throw new Error('useBacktest must be used within a BacktestProvider');
  }
  return context;
};

export const BacktestProvider = ({ children }) => {
  const [backtestData, setBacktestData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateBacktestData = (data) => {
    setBacktestData(data);
    setError(null);
  };

  const setLoadingState = (loading) => {
    setIsLoading(loading);
  };

  const setErrorState = (error) => {
    setError(error);
    setIsLoading(false);
  };

  const clearData = () => {
    setBacktestData(null);
    setError(null);
    setIsLoading(false);
  };

  return (
    <BacktestContext.Provider value={{
      backtestData,
      isLoading,
      error,
      updateBacktestData,
      setLoadingState,
      setErrorState,
      clearData
    }}>
      {children}
    </BacktestContext.Provider>
  );
};
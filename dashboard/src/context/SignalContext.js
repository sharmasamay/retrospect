import React, { createContext, useContext, useState } from 'react';

const SignalContext = createContext();

export const useSignal = () => {
  const context = useContext(SignalContext);
  if (!context) {
    throw new Error('useSignal must be used within a SignalProvider');
  }
  return context;
};

export const SignalProvider = ({ children }) => {
  const [signalData, setSignalData] = useState(null);
  const [signalInput, setSignalInput] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateSignalData = (data) => {
    setSignalData(data);
    setError(null);
  };

  const updateSignalInput = (data) => {
    setSignalInput(data);
    setError(null);
  }

  const setLoadingState = (loading) => {
    setIsLoading(loading);
  };

  const setErrorState = (error) => {
    setError(error);
    setIsLoading(false);
  };

  const clearData = () => {
    setSignalData(null);
    setError(null);
    setIsLoading(false);
  };

  return (
    <SignalContext.Provider value={{
      signalData,
      signalInput,
      isLoading,
      error,
      updateSignalData,
      updateSignalInput,
      setLoadingState,
      setErrorState,
      clearData
    }}>
      {children}
    </SignalContext.Provider>
  );
};
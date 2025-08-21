import React, { useState, useEffect } from 'react';
import { useSignal } from '../context/SignalContext';
import { useBacktest } from '../context/BacktestContext';

export default function LiveSignal() {
    const { signalInput } = useSignal();
    const { backtestData } = useBacktest();
    const [signalData, setSignalData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (signalInput) {
            handleGetSignal();
        }
    }, [signalInput]);

    const handleGetSignal = async () => {
        if (!signalInput) {
            setError('No signal input data available');
            return;
        }

        setIsLoading(true);
        setError(null);
        
        try {
            const response = await fetch('https://retrospect-u5bq.onrender.com/api/signal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(signalInput),
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(data)
            setSignalData(data);
        } catch (error) {
            console.error('Error fetching signal:', error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const clearData = () => {
        setSignalData(null);
        setError(null);
    };

    const getSignalColor = (signal) => {
        if (!signal) return '#6b7280';
        switch (signal.toUpperCase()) {
            case 'LONG':
            case 'BUY':
                return '#10b981';
            case 'SHORT':
            case 'SELL':
                return '#ef4444';
            case 'FLAT':
            case 'HOLD':
                return '#6b7280';
            default:
                return '#6b7280';
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            width: '100%'
        }}>
            <div style={{
                padding: '16px',
                backgroundColor: '#1a1a1a',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                margin: '20px 0',
                border: '1px solid #333333',
                maxWidth: '800px',
                width: '100%'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                    borderBottom: '1px solid #333333',
                    paddingBottom: '12px'
                }}>
                    <h3 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#ffffff',
                        margin: 0
                    }}>Live Trading Signal</h3>
                    
                    {signalData && (
                        <button 
                            onClick={clearData}
                            style={{
                                backgroundColor: '#333333',
                                color: '#ffffff',
                                border: '1px solid #555555',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: '500'
                            }}
                        >
                            Clear
                        </button>
                    )}
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div style={{
                        textAlign: 'center',
                        color: '#888888',
                        padding: '30px 20px'
                    }}>
                        Loading signal...
                    </div>
                )}

                {/* Error Display */}
                {error && !isLoading && (
                    <div style={{
                        backgroundColor: '#2d1b1b',
                        border: '1px solid #dc2626',
                        color: '#ff6b6b',
                        padding: '10px',
                        borderRadius: '4px',
                        marginBottom: '12px',
                        fontSize: '12px'
                    }}>
                        {error}
                    </div>
                )}

                {/* Signal Display */}
                {signalData && !isLoading && !error && (
                    <div style={{
                        padding: '16px',
                        backgroundColor: '#262626',
                        borderRadius: '6px',
                        border: '1px solid #333333'
                    }}>
                        {/* Main Signal */}
                        <div style={{
                            textAlign: 'center',
                            marginBottom: '16px'
                        }}>
                            <div style={{
                                fontSize: '24px',
                                fontWeight: '700',
                                color: getSignalColor(signalData[0].signal),
                                marginBottom: '4px'
                            }}>
                                {signalData[0].signal?.toUpperCase() || 'N/A'}
                            </div>
                            <div style={{
                                fontSize: '12px',
                                color: '#888888'
                            }}>
                                {signalData[0].symbol}
                            </div>
                        </div>

                        {/* Signal Details Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: '16px'
                        }}>
                            {signalData[0].current_price !== null && signalData[0].current_price !== undefined && (
                                <div>
                                    <div style={{ color: '#888888', fontSize: '11px', marginBottom: '2px' }}>
                                        Current Price
                                    </div>
                                    <div style={{ color: '#ffffff', fontSize: '14px', fontWeight: '600' }}>
                                        ${signalData[0].current_price.toFixed(2)}
                                    </div>
                                </div>
                            )}

                            {signalData[0].strategy_position !== null && signalData[0].strategy_position !== undefined && (
                                <div>
                                    <div style={{ color: '#888888', fontSize: '11px', marginBottom: '2px' }}>
                                        Position
                                    </div>
                                    <div style={{ 
                                        color: signalData[0].strategy_position === 1 ? '#10b981' : 
                                              signalData[0].strategy_position === -1 ? '#ef4444' : '#888888',
                                        fontSize: '14px', 
                                        fontWeight: '600' 
                                    }}>
                                        {signalData[0].strategy_position === 1 ? 'LONG' :
                                         signalData[0].strategy_position === -1 ? 'SHORT' :
                                         'FLAT'}
                                    </div>
                                </div>
                            )}

                            {signalData[0].timestamp && (
                                <div>
                                    <div style={{ color: '#888888', fontSize: '11px', marginBottom: '2px' }}>
                                        Date & Time
                                    </div>
                                    <div style={{ color: '#ffffff', fontSize: '12px' }}>
                                        {new Date(signalData[0].timestamp).toLocaleDateString()} {new Date(signalData[0].timestamp).toLocaleTimeString()}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* No Signal State */}
                {!signalData && !isLoading && !error && (
                    <div style={{
                        textAlign: 'center',
                        padding: '30px 20px'
                    }}>
                        <div style={{ 
                            color: '#888888', 
                            marginBottom: '12px',
                            fontSize: '12px'
                        }}>
                            {!signalInput ? 
                                'Configure signal input data to get started.' :
                                'Waiting for signal data...'
                            }
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
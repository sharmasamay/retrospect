import React, { useState, useEffect, useRef } from 'react';
import Candlestick from './CandleStick';
import EquityCurve from './EquityCurve';
import KPICards from './KPICards';
import RSICurve from './RSICurve';
import SMACurve from './SMACurve';
import LiveSignal from './LiveSignal';
import { useBacktest } from '../context/BacktestContext';
import './Dashboard.css';

export default function Dashboard() {
  const { backtestData } = useBacktest();
  const [visibleComponents, setVisibleComponents] = useState(0);
  const componentRefs = useRef([]);

  const components = [
    { id: 'kpi', component: <KPICards data={backtestData} />, delay: 0},
    { id: 'candlestick', component: <Candlestick />, delay: 3000 },
    { id: 'livesignal', component: <LiveSignal />, delay: 1500 },
    { 
      id: 'indicator', 
      component: backtestData?.technical_indicators?.RSI ? <RSICurve /> : <SMACurve />, 
      delay: 2000 
    },
    { id: 'equity', component: <EquityCurve />, delay: 2000 },
  ];

  useEffect(() => {
    if (!backtestData) return;

    let timeouts = [];
    let cumulativeDelay = 800; // Initial delay

    components.forEach((_, index) => {
      const timeout = setTimeout(() => {
        setVisibleComponents(prev => prev + 1);
        
        // Auto scroll to the new component
        setTimeout(() => {
          if (componentRefs.current[index]) {
            componentRefs.current[index].scrollIntoView({ 
              behavior: 'smooth',
              block: 'center'
            });
          }
        }, 200);
      }, cumulativeDelay);

      cumulativeDelay += components[index].delay;
      timeouts.push(timeout);
    });

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [backtestData]);

  // Reset when backtestData changes
  useEffect(() => {
    setVisibleComponents(0);
  }, [backtestData]);

  const WelcomeScreen = () => (
    <div className="welcome-screen max-w-4xl mx-auto p-6 bg-black rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-6 text-white">
        Backtesting Dashboard
      </h1>
      
      <p className="text-lg text-center mb-8 text-gray-300">
        Welcome! This tool allows you to test trading strategies on historical data and get live signals for your favorite tickers.
      </p>

      <div className="space-y-8">
        {/* Data Configuration Section */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-green-400 flex items-center">
            ⚙️ Data Configuration
          </h2>
          <div className="space-y-3 text-gray-300">
            <p><strong>Symbol:</strong> The ticker or asset you want to test (e.g. AAPL, BTC-USD).</p>
            <p><strong>Start Date / End Date:</strong> The historical range of data to run the backtest on.</p>
          </div>
        </div>

        {/* Portfolio and Broker Settings Section */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-yellow-400 flex items-center">
            💰 Portfolio and Broker Settings
          </h2>
          <div className="space-y-3 text-gray-300">
            <p><strong>Initial Capital:</strong> The starting amount of money in your account.</p>
            <p><strong>Commission:</strong> The cost charged per trade (flat fee or percentage).</p>
            <p><strong>Slippage:</strong> The difference between expected and actual trade price due to execution delay.</p>
          </div>
        </div>

        {/* Strategy Configuration Section */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-purple-400 flex items-center">
            📊 Strategy Configuration
          </h2>
          <div className="space-y-3 text-gray-300">
            <p><strong>Strategy Type:</strong> The trading approach (e.g. RSI, Moving Average Crossover).</p>
            <p><strong>Period:</strong> The lookback window size used in calculations (e.g. 14 days for RSI).</p>
            <p><strong>Short Period:</strong> The fast-moving average that reacts quickly to price changes (e.g. 10 days).</p>
            <p><strong>Long Period:</strong> The slow-moving average that smooths out long-term trends (e.g. 50 days).</p>
            <p><strong>Overbought Threshold:</strong> A level above which the asset may be considered "overbought" (e.g. 70 in RSI).</p>
            <p><strong>Oversold Threshold:</strong> A level below which the asset may be considered "oversold" (e.g. 30 in RSI).</p>
          </div>
        </div>

        {/* Get Started Section */}
        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <h2 className="text-xl font-semibold mb-4 text-indigo-400 flex items-center justify-center">
            🚀 Get Started
          </h2>
          <p className="text-lg text-gray-300">Configure your settings and run your first backtest!</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard">
      {!backtestData ? (
        <WelcomeScreen />
      ) : (
        <>
          <h2 className="text-xl font-semibold mb-2 text-center">Results</h2>
          {components.map((item, index) => (
            <div
              key={item.id}
              ref={el => componentRefs.current[index] = el}
              className={`dashboard-component ${
                index < visibleComponents ? 'visible' : 'hidden'
              }`}
              style={{
                opacity: index < visibleComponents ? 1 : 0,
                transform: index < visibleComponents ? 'translateY(0)' : 'translateY(20px)',
                transition: 'opacity 0.6s ease, transform 0.6s ease'
              }}
            >
              {item.component}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
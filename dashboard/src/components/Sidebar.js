import './Sidebar.css';
import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useBacktest } from '../context/BacktestContext';
import { useSignal } from '../context/SignalContext';

export default function Sidebar() {
    const { updateBacktestData, setLoadingState, setErrorState } = useBacktest();
    const { updateSignalInput } = useSignal();
    const [ticker,setTicker] = useState("AAPL");
    const [startDate,setStartDate] = useState("2023-01-01");
    const [endDate,setEndDate] = useState("2024-01-01");
    const [capital,setCapital] = useState(100000);
    const [commission,setCommission] = useState(0);
    const [slippage,setSlippage] = useState(0);
    const [strat, setStrat] = useState("RSI");
    const [period,setPeriod] = useState(14);
    const [overbought,setOverbought] = useState(70);
    const [oversold,setOversold] = useState(30);
    const[short,setShort] = useState(5);
    const[long,setLong] = useState(20); 
    const handleDropdownChange = (event) => {
    setStrat(event.target.value);
    };

    const handleExecute = async (event) => {
            try {
            setLoadingState(true);
            
            const backtestData = {
                "name": "Random Backtest",
                "data": {
                    "symbols": [ticker],
                    "start_date": startDate,
                    "end_date": endDate,
                    "interval": "1d"
                },
                "broker_settings": {
                    "commission_per_share": parseFloat(commission) || 0.0,
                    "slippage_bps": parseFloat(slippage) || 0.0
                },
                "portfolio_settings": {
                    "initial_capital": parseFloat(capital) || 100000.0
                },
            };

            if(strat==="RSI"){
                backtestData["strategy"] = {
                    "name": strat,
                    "parameters": {
                        "period": parseInt(period) || 14,
                        "oversold_threshold": parseInt(oversold) || 30,
                        "overbought_threshold": parseInt(overbought) || 70,
                        "target_symbol": ticker
                    }
                }
            }
            else if (strat ==="SMA Crossover"){
                backtestData["strategy"] = {
                    "name": strat,
                    "parameters": {
                        "short_window": parseInt(short) || 10,
                        "long_window": parseInt(long) || 20,
                        "target_symbol": ticker
                    }
                }
            }

            const backtestResponse = await fetch("https://retrospect-u5bq.onrender.com/api/backtest/run", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(backtestData)
            });

            if (!backtestResponse.ok) {
                throw new Error(`HTTP error! status: ${backtestResponse.status}`);
            }

            const backtestResult = await backtestResponse.json();
            console.log(backtestResult)
            updateBacktestData(backtestResult);

            const signalInput = {
                "symbols": [ticker],
                "strategy_name": strat,
                "interval": "1d",
                "lookback_period": 250
            }
            if(strat==="RSI"){
                signalInput["strategy_params"] = {
                    "period":period,
                    "oversold_threshold":oversold,
                    "overbought_threshold":overbought
                }
            }
            else if(strat==="SMA Crossover"){
                signalInput["strategy_params"] = {
                    "short_window":short,
                    "long_window":long
                }
            }

            updateSignalInput(signalInput);
        
            
        } catch (error) {
            console.error("Error executing backtest:", error);
            setErrorState(error.message);
        } finally {
            setLoadingState(false);
        }
    }
  return (
    <div className="sidebar">
      <h2 className="text-xl font-semibold mb-3">Configuration</h2>
      <div className='data'>
        <h3 className='dataconfig'>Data Configuration</h3>
      <div className='symbol'>
        <label className="block mb-1">Symbol</label>
        <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder="Enter stock name"
        />
      </div>
      <div className='dates'>
        <div className="date-row">
          <div className="date-input">
            <label className="block mb-1">Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} id="startdate"/>
          </div>
          <div className="date-input">
            <label className="block mb-1">End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} id="enddate"/>
          </div>
        </div>
      </div>
      </div>
      <div className='bandp'>
            <h3 className='banpsettings'> Portfolio and Broker Settings</h3>
            <label className="block mb-1">Initial capital</label>
            <input
                type="text"
                value={capital}
                onChange={(e) => setCapital(e.target.value)}
                placeholder="Enter initial capital"
            />
            <div className='broker'>
                <div>
                    <label className="block mb-1">Commission</label>
                    <input
                    type="text"
                    value={commission}
                    onChange={(e) => setCommission(e.target.value)}
                    placeholder="Enter commission"
                    />
                </div>
                <div>
                    <label className="block mb-1">Slippage</label>
                    <input
                    type="text"
                    value={slippage}
                    onChange={(e) => setSlippage(e.target.value)}
                    placeholder="Enter slippage"
                    />
                </div>
            </div>
      </div>
        <div className='stratconfig'>
        <h3 className='strategyconfig'>Strategy Configuration</h3>
        <div className='type'>
        <label className="block mb-1">Strategy Type</label>
        <select id="dropdown" value={strat} onChange={handleDropdownChange} name="dropdown">
            <option value="RSI">RSI</option>
            <option value="SMA Crossover">Simple Moving Average Crossover</option>
            </select>
        </div>
        {strat === 'RSI' && (
            <div className="rsi">
            <label className="block mb-1">Period</label>
            <div style={{position: 'relative', marginBottom: '20px'}}>
                <span style={{position: 'absolute', top: '-25px', left: `${(period/100) * 100}%`, transform: 'translateX(-50%)', backgroundColor: '#333', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '12px'}}>{period}</span>
                <input type="range" value={period} onChange={(e) => setPeriod(e.target.value)} min="0" max="100" />
            </div>
            <label className="block mb-1">Overbought Threshold</label>
            <div style={{position: 'relative', marginBottom: '20px'}}>
                <span style={{position: 'absolute', top: '-25px', left: `${(overbought/100) * 100}%`, transform: 'translateX(-50%)', backgroundColor: '#333', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '12px'}}>{overbought}</span>
                <input type="range" value={overbought} onChange={(e) => setOverbought(e.target.value)} min="0" max="100" />
            </div>
            <label className="block mb-1">Oversold Threshold</label>
            <div style={{position: 'relative', marginBottom: '20px'}}>
                <span style={{position: 'absolute', top: '-25px', left: `${(oversold/100) * 100}%`, transform: 'translateX(-50%)', backgroundColor: '#333', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '12px'}}>{oversold}</span>
                <input type="range" value={oversold} onChange={(e) => setOversold(e.target.value)} min="0" max="100" />
            </div>
            </div>
        )}
        {strat === 'SMA Crossover' && (
            <div className="sma">
            <label className="block mb-1">Short Window</label>
            <div style={{position: 'relative', marginBottom: '20px'}}>
                <span style={{position: 'absolute', top: '-25px', left: `${((short-5)/(50-5)) * 100}%`, transform: 'translateX(-50%)', backgroundColor: '#333', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '12px'}}>{short}</span>
                <input type="range" value={short} onChange={(e) => setShort(e.target.value)} min="5" max="50" />
            </div>
            <label className="block mb-1">Long Window</label>
            <div style={{position: 'relative', marginBottom: '20px'}}>
                <span style={{position: 'absolute', top: '-25px', left: `${((long-20)/(200-20)) * 100}%`, transform: 'translateX(-50%)', backgroundColor: '#333', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '12px'}}>{long}</span>
                <input type="range" value={long} onChange={(e) => setLong(e.target.value)} min="20" max="200" />
            </div>
            </div>
        )}
      </div>
      <div className='exec' style={{display: 'flex', justifyContent: 'center', marginTop: '20px'}}>
        <button type="button" onClick={handleExecute}>
        Execute
      </button>
      </div>
    </div>
  );
}
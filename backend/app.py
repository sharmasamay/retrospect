import sys
import os
from typing import Dict,List, Optional

import numpy as np

from fastapi import Request, Response
from fastapi.responses import JSONResponse
import traceback 
from engine.broker import Broker
from engine.portfolio import Portfolio

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware # For CORS
from pydantic import BaseModel, Field

import pandas as pd 
from datetime import date, datetime

from utils.data_loader import load_historical_data
from utils.strategy_loader import get_available_strategies
from engine.backtester import Backtester
from engine.metrics import Metrics
from utils.live_data import get_recent_history

class StrategyParameter(BaseModel):
    key: str
    value: str | int | float | bool

class StrategyConfig(BaseModel):
    name: str
    parameters: Dict[str, str | int | float | bool] = Field(default_factory=dict)

class DataConfig(BaseModel):
    symbols: List[str]
    start_date: date
    end_date : date
    interval: str = "1d"

class BrokerSettings(BaseModel):
    commission_per_share: float = 0.0
    slippage_bps: float = 0.0

class PortfolioSettings(BaseModel):
    initial_capital: float = 100000.0

class BacktestConfig(BaseModel):
    name: str = "Unnamed Experiment"
    data: DataConfig
    broker_settings: BrokerSettings = Field(default_factory=BrokerSettings)
    portfolio_settings: PortfolioSettings = Field(default_factory=PortfolioSettings)
    strategy: StrategyConfig

class AvailableStrategy(BaseModel):
    name: str
    class_name: str 
    description: str = ""

class PerformanceSummary(BaseModel):
    # Using Optional to allow np.nan which Pydantic converts to null
    total_return_pct: Optional[float] = Field(None, alias='Total Return(%)')
    annualized_return_pct: Optional[float] = Field(None, alias='Annualized Return(%)')
    annualized_volatility_pct: Optional[float] = Field(None, alias='Annualized Volatility (%)')
    sharpe_ratio: Optional[float] = Field(None, alias='Sharpe Ratio')
    max_drawdown_pct: Optional[float] = Field(None, alias='Max Drawdown (%)')
    winning_days_pct: Optional[float] = Field(None, alias='Winning Days (%)')
    losing_days_pct: Optional[float] = Field(None, alias='Losing Days (%)')
    trade_count: int = Field(0, alias='Trade Count')
    experiment_name: str = Field("N/A", alias='Experiment Name')

    class Config:
        populate_by_name = True 
        arbitrary_types_allowed = True

class BacktestRunResponse(BaseModel):
    success: bool
    message: str
    summary: PerformanceSummary
    ohcl_data: List[Dict]
    equity_curve_data: List[Dict] # List of dicts for Date/Value, e.g., [{"Date": "2023-01-01", "Value": 100000}]
    trade_log_data: List[Dict]
    technical_indicators: Dict = Field(default_factory=dict)  # Use generic Dict type # For future indicators

class LiveSignalRequest(BaseModel):
    symbols: List[str] # List of symbols to get signals for
    strategy_name: str
    strategy_params: Dict[str, str | int | float | bool] = Field(default_factory=dict)
    interval: str = "1d"
    lookback_period: int = 250

class LiveSignalResponse(BaseModel):
    symbol: str # The specific symbol this signal applies to
    timestamp: str # The timestamp of the latest bar
    signal: str # The inferred signal (e.g., "BUY", "SELL", "HOLD", "LONG", "FLAT")
    current_price: Optional[float] = None
    strategy_position: Optional[int] = None # -1 (short), 0 (flat), or 1 (long)
    message: str = "Signal generated successfully."
    success: bool = True

# Initialize the FastAPI application
app = FastAPI(
    title="Quant Backtesting Engine API",
    description="API for running quantitative backtests and retrieving results.",
    version="0.1.0",
)

# --- CORS Configuration ---
# This is crucial for your React frontend to be able to talk to your FastAPI backend
# during development (as they will run on different ports).
# For production, you might restrict origins to your frontend's domain.
origins = [
    "http://localhost:3000",  # React development server
    "http://127.0.0.1:3000",  # Alternative localhost
    "https://retrospect-u5bq.onrender.com",  # Alternative localhost
    "*"  # Allow all origins for development (remove in production)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)
@app.options("/api/backtest/run")
async def options_backtest():
    return {"message": "OK"}

@app.options("/api/strategies")
async def options_strategies():
    return {"message": "OK"}

@app.options("/api/signal")
async def options_signal():
    return {"message": "OK"}

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    print(f"Unhandled exception: {exc}")
    traceback.print_exc()
    
    response = JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"}
    )
    
    # Ensure CORS headers are present
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    
    return response

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    response = JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )
    
    # Ensure CORS headers are present
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    
    return response


@app.get("/api/strategies", response_model=List[AvailableStrategy], summary="Get available backtesting strategies")
async def get_strategies():
    strategies = get_available_strategies()
    strategies_list = []
    for name, strategy_class in strategies.items():
        strategies_list.append(AvailableStrategy(
            name=name,
            class_name=strategy_class.__name__, # The actual Python class name string
            description=strategy_class.__doc__.strip().split('\n')[0] if strategy_class.__doc__ else "" # First line of docstring
        ))
    return strategies_list

@app.post("/api/backtest/run",response_model=BacktestRunResponse, summary="Run a single backtest experiment")
async def run_backtest(config_data:BacktestConfig):
    try:
        # --- 1. Extract Parameters from Pydantic Model ---
        experiment_name = config_data.name

        # Data Config
        symbols = config_data.data.symbols
        start_date_str = config_data.data.start_date.strftime('%Y-%m-%d') # Convert date object to string
        end_date_str = config_data.data.end_date.strftime('%Y-%m-%d')
        interval = config_data.data.interval

        # Broker Config
        commission_per_share = config_data.broker_settings.commission_per_share
        slippage_bps = config_data.broker_settings.slippage_bps

        # Portfolio Config
        initial_capital = config_data.portfolio_settings.initial_capital

        # Strategy Config
        strategy_name = config_data.strategy.name
        strategy_params = config_data.strategy.parameters

        # --- 2. Load Market Data ---
        market_data = load_historical_data(symbols, start_date_str, end_date_str, interval)
        if market_data.empty:
            return BacktestRunResponse(
                success=False,
                message=f"No data loaded for {symbols} from {start_date_str} to {end_date_str}.",
                summary=PerformanceSummary(), # Return default empty summary
                ohcl_data=[],
                equity_curve_data=[],
                trade_log_data=[],
                technical_indicators={}
            )
        
        candlestick_data = []
        technical_indicators = {}
        target_symbol = strategy_params.get('target_symbol')
        if target_symbol and target_symbol in symbols:
            # We need to get the OHLCV data for the target symbol from the market_data DataFrame.
            # We must convert the MultiIndex DataFrame to a list of dicts for JSON serialization.
            ohlcv_df = market_data.loc[(slice(None), target_symbol), :].copy() # Slice out the single symbol's data
            ohlcv_df.reset_index(level='Symbol', drop=True, inplace=True) # Drop the symbol level
            try:
                import pandas_ta as ta
                
                if(strategy_name=="RSI"):
                # Calculate RSI
                    rsi_period = strategy_params.get('period', 14)  # Default to 14
                    rsi_values = ta.rsi(ohlcv_df['Close'], length=rsi_period)
                    
                    # Create RSI data
                    rsi_df = pd.DataFrame({
                        'Date': ohlcv_df.index,
                        'RSI_Value': rsi_values,
                    })
                    rsi_df['Date'] = rsi_df['Date'].dt.strftime('%Y-%m-%d %H:%M:%S')
                    rsi_df = rsi_df.dropna()  # Remove NaN values
                    rsi_data = rsi_df.to_dict(orient='records')
                    technical_indicators['RSI'] = rsi_data
                    technical_indicators['Overbought_Threshold'] = strategy_params.get('overbought_threshold', 70)
                    technical_indicators['Oversold_Threshold'] = strategy_params.get('oversold_threshold', 30)
                
                elif(strategy_name=="SMA Crossover"):
                    # Calculate SMA crossover (short and long averages)
                    short_period = strategy_params.get('short_window', 10)  # Default short SMA
                    long_period = strategy_params.get('long_window', 20)   # Default long SMA

                    short_sma = ta.sma(ohlcv_df['Close'], length=short_period)
                    long_sma = ta.sma(ohlcv_df['Close'], length=long_period)
                    
                    # Create SMA crossover data
                    sma_df = pd.DataFrame({
                        'Date': ohlcv_df.index,
                        'Short_SMA': short_sma,
                        'Long_SMA': long_sma,
                    })
                    sma_df['Date'] = sma_df['Date'].dt.strftime('%Y-%m-%d %H:%M:%S')
                    sma_df = sma_df.dropna()  # Remove NaN values
                    sma_data = sma_df.to_dict(orient='records')
                    
                    # Add to technical indicators dictionary
                    technical_indicators['SMA_Crossover'] = sma_data
                
            except Exception as indicator_error:
                print(f"Error calculating technical indicators: {indicator_error}")
            ohlcv_df['Date'] = ohlcv_df.index # Make Date a column
            ohlcv_df['Date'] = ohlcv_df['Date'].dt.strftime('%Y-%m-%d %H:%M:%S') # Format datetime for JSON
            candlestick_data = ohlcv_df[['Date', 'Open', 'High', 'Low', 'Close']].to_dict(orient='records')
        # --- 3. Get Strategy Class & Instantiate ---
        available_strategies = get_available_strategies() # Re-discover in case of changes
        if strategy_name not in available_strategies:
            raise ValueError(f"Strategy '{strategy_name}' not found. Available: {list(available_strategies.keys())}")

        strategy_class = available_strategies[strategy_name]
        strategy_instance = strategy_class(**strategy_params) # Instantiate with parameters

        # --- 4. Instantiate Backtester and Run ---
        backtester = Backtester(
            data=market_data,
            strategy=strategy_instance.__class__, 
            initial_capital=initial_capital,
            commission_per_share=commission_per_share,
            slippage_bps=slippage_bps,
            symbols=symbols
        )
        backtester.strategy_instance = strategy_instance 

        final_portfolio = backtester.run()

        # --- 5. Collect and Serialize Results ---
        equity_curve = final_portfolio.get_equity_curve()

        # Adjust annualization_factor for metrics calculation
        if interval == '1d': annualization_factor = 252
        elif interval == '1h': annualization_factor = 252 * 6.5
        elif interval == '30m': annualization_factor = 252 * 13
        else: annualization_factor = 252

        performance_summary_dict = Metrics.performance_summary(
            equity_curve,
            risk_free_rate=0.0,
            annualization_factor=annualization_factor,
            trade_count=len(final_portfolio.trades)
        )
        for key, value in performance_summary_dict.items():
            if isinstance(value, float) and np.isnan(value):
                performance_summary_dict[key] = None
        performance_summary_dict['Experiment Name'] = experiment_name

        # Convert Pandas Series/DataFrame to list of dictionaries for JSON serialization
        equity_curve_list = []
        if not equity_curve.empty:
            # Create a DataFrame from Series to easily convert to list of dicts
            temp_df = pd.DataFrame({'Date': equity_curve.index, 'Value': equity_curve.values})
            temp_df['Date'] = temp_df['Date'].dt.strftime('%Y-%m-%d %H:%M:%S') # Format datetime for JSON
            equity_curve_list = temp_df.to_dict(orient='records')

        trade_log_list = []
        if final_portfolio.trades:
            trade_log_df = pd.DataFrame(final_portfolio.trades)
            # Format timestamp for JSON
            trade_log_df['timestamp'] = trade_log_df['timestamp'].dt.strftime('%Y-%m-%d %H:%M:%S')
            trade_log_list = trade_log_df.to_dict(orient='records')

        # --- 6. Return Response ---
        return BacktestRunResponse(
            success=True,
            message=f"Backtest for {experiment_name} completed successfully.",
            summary=PerformanceSummary(**performance_summary_dict), # Unpack dict into Pydantic model
            ohcl_data=candlestick_data,
            equity_curve_data=equity_curve_list,
            trade_log_data=trade_log_list,
            technical_indicators=technical_indicators

        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backtest execution error for '{experiment_name}': {e}")

@app.post("/api/signal", response_model=List[LiveSignalResponse], summary="Generate live trading signals for selected symbols/strategy")
async def generate_live_signal(signal_request: LiveSignalRequest):
    response_signals = []
    try:
        symbols = signal_request.symbols
        strategy_name = signal_request.strategy_name
        strategy_params = signal_request.strategy_params
        interval = signal_request.interval
        lookback_period = signal_request.lookback_period

        recent_history = get_recent_history(symbols, interval, lookback_period)

        if(recent_history.empty):
            raise HTTPException(status_code=404, detail=f"No recent data loaded for {symbols} ({interval}). Please check symbols/interval or market hours.")
        
        available_strategies = get_available_strategies()
        if strategy_name not in available_strategies:
            raise HTTPException(status_code=400, detail=f"Strategy '{strategy_name}' not found. Available: {list(available_strategies.keys())}")
        
        strategy_class = available_strategies[strategy_name]

        for symbol in symbols:
            single_history = recent_history.loc[(slice(None), symbol), :].copy()
            if single_history.empty:
                response_signals.append(LiveSignalResponse(
                    symbol=symbol,
                    timestamp=datetime.now().isoformat(),
                    signal="N/A",
                    message=f"No recent data available for {symbol}.",
                    success=False
                ))
                continue

            if len(single_history) < lookback_period: # Or strategy's actual min lookback
                response_signals.append(LiveSignalResponse(
                    symbol=symbol,
                    timestamp=single_history.index[-1][0].isoformat() if not single_history.empty else datetime.now().isoformat(),
                    signal="N/A",
                    message=f"Insufficient history ({len(single_history)} bars) for {symbol}. Needed {lookback_period}.",
                    success=False
                ))
                continue

            portfolio_monitor = Portfolio(initial_capital=10000000.0) 
            broker_monitor = Broker(commission_per_share=0.0, slippage_bps=0.0)

            if 'target_symbol' in strategy_class.__init__.__code__.co_varnames:
                current_strategy_params = strategy_params.copy()
                current_strategy_params['target_symbol'] = symbol
                strategy_instance = strategy_class(**current_strategy_params)
            
            else:
                strategy_instance = strategy_class(**strategy_params)
            
            current_signal = "HOLD"
            final_strategy_position = 0
            latest_bar_price = None
            latest_bar_timestamp = None

            for current_date_multiindex, row_data_series in single_history.iterrows():
                latest_bar_timestamp = current_date_multiindex[0] # The date part of the MultiIndex
                latest_bar_symbol = current_date_multiindex[1]
                data_for_day = pd.DataFrame([row_data_series])
                data_for_day.index = pd.Index([latest_bar_symbol], name='Symbol')

                try:
                    strategy_instance.on_data(latest_bar_timestamp, data_for_day, portfolio_monitor, broker_monitor)
                    final_strategy_position = strategy_instance.position 
                    latest_bar_price = row_data_series['Close']

                except Exception as e:
                    print(f"Error in strategy {strategy_name} on_data for {symbol} at {latest_bar_timestamp}: {e}")
                    current_signal = "ERROR" 
                    final_strategy_position = np.nan 
                    latest_bar_price = np.nan
                    break
            
            if current_signal != "ERROR":
                if final_strategy_position == 1:
                    current_signal = "LONG"
                elif final_strategy_position == 0:
                    current_signal = "FLAT"
                elif final_strategy_position == -1:
                    current_signal = "SHORT"
                else:
                    current_signal = "N/A"

            response_signals.append(LiveSignalResponse(
                symbol=symbol,
                timestamp=latest_bar_timestamp.isoformat() if latest_bar_timestamp else datetime.now().isoformat(),
                signal=current_signal,
                current_price=latest_bar_price,
                strategy_position=final_strategy_position,
                message="Signal generated successfully." if current_signal != "ERROR" else "Strategy execution error.",
                success=True if current_signal != "ERROR" else False
            ))
    
    except ValueError as ve: # For specific validation errors from your code
        raise HTTPException(status_code=400, detail=f"Bad Request: {ve}")
    except Exception as e: # Catch any other unexpected errors from your backend logic
        print(f"An unexpected error occurred in generate_live_signal: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {e}")

    return response_signals


@app.get("/")
async def read_root():
    return {"message": "Welcome to the Quant Backtesting Engine API!"}

# You will add more complex endpoints here in subsequent steps
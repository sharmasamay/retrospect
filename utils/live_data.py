import yfinance as yf
import pandas as pd
import numpy as np # For np.nan handling
from datetime import datetime, timedelta
from typing import List

def get_recent_history(symbols:List[str],interval:str = "1d",lookback_period:int=200) ->pd.DataFrame:
    if not symbols:
        return pd.DataFrame()
        
    if interval == '1m':
        period = '7d' # Max period for 1m interval
    elif interval in ['5m', '15m', '30m', '1h']:
        period = '60d' # Max period for these intraday intervals
    else: # Daily, weekly, monthly intervals
        period = f"{lookback_period*2}d" if lookback_period*2 > 7 else "7d"
    
    data = []
    for ticker in symbols:
        try:
            df = yf.download(ticker, period = period,interval = interval, progress=False, auto_adjust=True)
            if df.empty:
                print(f"Warning: No data found for {ticker} for the interval and period.")
                continue
            df.reset_index(inplace=True)
            if 'Datetime' in df.columns:
                df.rename(columns={'Datetime': 'Date'}, inplace=True)
            df['Symbol'] = ticker
            df.columns = [col[0] for col in df.columns]
            data.append(df)
        except Exception as e:
            print(f"Error downloading data for {ticker}: {e}")
    
    if not data:
            return pd.DataFrame()
    combined_data = pd.concat(data,ignore_index=True)
    combined_data = combined_data[['Date', 'Symbol', 'Open', 'High', 'Low', 'Close', 'Volume']]
    combined_data.set_index(['Date','Symbol'], inplace=True)
    combined_data.sort_index(inplace=True)
    return combined_data
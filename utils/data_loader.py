import yfinance as yf
import pandas as pd
import os

def load_historical_data(tickers:list[str], start_date, end_date, interval:str = "1d"):
    data = []
    for ticker in tickers:
        try:
            df = yf.download(ticker, start=start_date, end=end_date, interval=interval, progress=False)
            if df.empty:
                print(f"Warning: No data found for {ticker} from {start_date} to {end_date}.")
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



def load_csv_data(file_path):
    data = pd.read_csv(file_path, parse_dates=True, index_col='Date')
    if('Symbol' not in data.columns):
        pass
    return data


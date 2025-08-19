# run_live_data_loader_test.py
import pandas as pd
import numpy as np # For potential use by pandas/yfinance internally, or if your function uses it
from utils.live_data import get_recent_history # Import the function to test

print("--- Running Manual Live Data Loader Test ---")

if __name__ == "__main__":
    # --- Setup Test Parameters ---
    symbols_to_test = ['AAPL', 'MSFT'] # Test with multiple common symbols
    test_interval = '1h' # Daily data
    test_lookback_period = 10 # Get last 10 days of data per symbol

    print(f"\nAttempting to fetch recent history for {symbols_to_test} ({test_interval} interval) with lookback {test_lookback_period}...")

    try:
        # Call your function
        recent_history_df = get_recent_history(
            symbols=symbols_to_test,
            interval=test_interval,
            lookback_period=test_lookback_period
        )

        if not recent_history_df.empty:
            print("\n--- Successfully fetched recent history ---")
            print("DataFrame Head:")
            print(recent_history_df.head(10)) # Print more rows to see multiple symbols

            print("\nDataFrame Info:")
            recent_history_df.info()

            print(f"\nDataFrame Shape: {recent_history_df.shape}")
            print(f"Index Levels: {recent_history_df.index.names}")
            print(f"Is MultiIndexed: {isinstance(recent_history_df.index, pd.MultiIndex)}")
            print(f"Unique Dates: {recent_history_df.index.get_level_values('Date').unique().min().date()} to {recent_history_df.index.get_level_values('Date').unique().max().date()}")
            print(f"Unique Symbols: {recent_history_df.index.get_level_values('Symbol').unique().tolist()}")
            
            # Verify lookback_period per symbol
            rows_per_symbol = recent_history_df.groupby(level='Symbol').size()
            print("\nRows per Symbol (should match lookback_period):")
            print(rows_per_symbol)
            # You want all values in rows_per_symbol to be equal to test_lookback_period

        else:
            print("\nNo data returned. The DataFrame is empty. Check warnings/errors above.")

    except Exception as e:
        print(f"\nAn error occurred while running the live data loader test: {e}")
        import traceback
        traceback.print_exc() # Print full traceback for debugging

    print("\n--- Manual Live Data Loader Test Complete ---")
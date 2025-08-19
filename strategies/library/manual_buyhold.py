import pandas as pd
from engine.portfolio import Portfolio
from engine.broker import Broker
from strategies.base import BaseStrategy

class ManualBuyAndHoldStrategy(BaseStrategy): # Renamed: no leading underscore
    """
    Buys a fixed quantity of a SPECIFIC target_symbol once on the first opportunity
    (if sufficient cash) and holds it.
    """
    def __init__(self, name="ManualSingleAssetBuyAndHold", target_symbol: str = None, **kwargs):
        super().__init__(name, **kwargs) # Pass kwargs up to BaseStrategy
        self.bought = False
        self.target_symbol = target_symbol # This strategy instance cares about this specific symbol

    # The on_data method receives current_date and data_for_day (a DataFrame)
    def on_data(self, current_timestamp: pd.Timestamp, data_for_day: pd.DataFrame, portfolio: Portfolio, broker: Broker):
        # Ensure we have a target symbol and data for that symbol is present for today
        if self.target_symbol is None or self.target_symbol not in data_for_day.index:
            # print(f"DEBUG: Skipping day {current_date.date()} for {self.target_symbol} - no data or target not set.")
            return

        current_price = data_for_day.loc[self.target_symbol, 'Close']

        # Basic validation for price before attempting trade
        if pd.isna(current_price) or current_price <= 0:
            print(f"Skipping {self.target_symbol} on {current_timestamp.date()}: Invalid price {current_price:.2f}")
            return

        shares_to_buy = 10 # Example fixed quantity to buy
        estimated_commission = shares_to_buy * broker.commission_per_share
        cost_of_trade = current_price * shares_to_buy + estimated_commission

        # Trading logic: Buy once if not already bought and sufficient cash
        if not self.bought and portfolio.cash >= cost_of_trade: 
            print(f"Attempting to BUY {shares_to_buy} {self.target_symbol} at {current_price:.2f} on {current_timestamp.date()}")
            broker.execute_order(current_timestamp, portfolio, self.target_symbol, 'BUY', shares_to_buy, current_price)
            self.bought = True # Mark as bought so it doesn't buy again
            print(f"Executed BUY {self.target_symbol}. New cash: {portfolio.cash:.2f}, Position {self.target_symbol}: {portfolio.get_position(self.target_symbol)}")
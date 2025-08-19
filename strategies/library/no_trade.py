# strategies/library/no_trade_strategy.py
import pandas as pd
from engine.portfolio import Portfolio
from engine.broker import Broker
from strategies.base import BaseStrategy

class NoTradeStrategy(BaseStrategy): # Renamed: removed leading underscore
    """
    A strategy that performs no trades throughout the backtest.
    Useful as a benchmark or for testing engine mechanics without trading.
    """
    def __init__(self, name="NoTrade", **kwargs): # Ensure **kwargs is here
        super().__init__(name, **kwargs) # Pass kwargs up

    # The on_data method must match the BaseStrategy signature
    def on_data(self, current_timestamp: pd.Timestamp, data_for_day: pd.DataFrame, portfolio: Portfolio, broker: Broker):
        # This strategy intentionally does nothing.
        pass
import pandas as pd
from engine.portfolio import Portfolio
from engine.broker import Broker
from strategies.base import BaseStrategy

class ErrorProneStrategy(BaseStrategy): # Renamed: removed leading underscore
    """
    A strategy designed to raise an exception after a specified number of data points.
    Useful for testing error handling mechanisms of the backtesting engine.
    """
    def __init__(self, name="ErrorProne", error_after_n_points: int = 3, **kwargs):
        super().__init__(name, **kwargs)
        self.data_points_processed = 0
        self.error_after_n_points = error_after_n_points 

    # The on_data method must match the BaseStrategy signature
    def on_data(self, current_timestamp: pd.Timestamp, data_for_day: pd.DataFrame, portfolio: Portfolio, broker: Broker):
        self.data_points_processed += 1
        if self.data_points_processed > self.error_after_n_points:
            raise ValueError("Simulated strategy error!")
        pass
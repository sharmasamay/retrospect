from abc import ABC, abstractmethod
import pandas as pd
from engine.portfolio import Portfolio
from engine.broker import Broker

class BaseStrategy(ABC):
    """Abstract base class for trading strategies."""
    def __init__(self, name: str = "BaseStrategy", **kwargs):
        self.name = name
        self.params = kwargs
    
    @abstractmethod
    def on_data(self,current_timestamp:pd.Timestamp, data: pd.DataFrame, portfolio: Portfolio, broker: Broker):
        """
        Abstract method to be implemented by subclasses.
        This method will be called with new data.
        
        :param timeStamp: Timestamp of the data point.
        :param data: New data point (e.g., price, volume).
        :param portfolio: Current portfolio state.
        :param broker: Broker instance for executing trades.
        """
        pass
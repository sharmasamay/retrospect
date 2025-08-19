import pandas as pd
from strategies.base import BaseStrategy
from engine.broker import Broker
from engine.portfolio import Portfolio
from typing import Type

class Backtester:
    def __init__(self, data:pd.DataFrame,strategy:Type[BaseStrategy],initial_capital:float,commission_per_share:float,slippage_bps:float,symbols:list[str]):
        if not isinstance(data, pd.DataFrame) or data.empty:
            raise ValueError("Input data must be a non-empty Pandas DataFrame.")
        if not isinstance(data.index, pd.MultiIndex) or 'Date' not in data.index.names or 'Symbol' not in data.index.names:
            raise ValueError("Data index must be a Pandas MultiIndex with 'Date' and 'Symbol' levels.")
        if not isinstance(data.index.get_level_values('Date'), pd.DatetimeIndex):
            raise ValueError("The 'Date' level of the MultiIndex must be a DatetimeIndex.")
        if not all(col in data.columns for col in ['Open', 'High', 'Low', 'Close', 'Volume']):
            raise ValueError("Data DataFrame must contain 'Open', 'High', 'Low', 'Close', 'Volume' columns.")
        
        self.data = data.sort_index()

        if not issubclass(strategy, BaseStrategy):
            raise ValueError("Strategy must be a class inheriting from BaseStrategy.")
        if initial_capital <= 0:
            raise ValueError("Initial capital must be positive.")
        if commission_per_share < 0:
            raise ValueError("Commission per share cannot be negative.")
        if slippage_bps < 0:
            raise ValueError("Slippage basis points cannot be negative.")
        if not isinstance(symbols, list) or not all(isinstance(s, str) and s for s in symbols):
            raise ValueError("Symbols must be a non-empty list of strings.")
        
        self.strategy_class = strategy
        self.initial_capital = initial_capital
        self.commission_per_share = commission_per_share
        self.slippage_bps = slippage_bps
        self.symbols = symbols

        self.portfolio:Portfolio = None
        self.broker:Broker = None
        self.strategy_instance: BaseStrategy = None

    def run(self):
        self.portfolio = Portfolio(initial_capital=self.initial_capital)
        self.broker = Broker(commission_per_share=self.commission_per_share,slippage_bps=self.slippage_bps)
        #self.strategy_instance = self.strategy_class()
        unique_dates = self.data.index.get_level_values('Date').unique().sort_values()
        for current_date in unique_dates:
            day_data = self.data.loc[current_date]
            current_prices = day_data['Close'].to_dict()
            try:
                self.strategy_instance.on_data(
                    current_timestamp=current_date,
                    data_for_day=day_data,
                    portfolio=self.portfolio,
                    broker=self.broker
                )
            except Exception as e:
                print(f"Error in strategy.on_data for {self.symbols} at {current_date}: {e}")
                break 
            self.portfolio.record_equity(current_date, current_prices)
        trade_count = len(self.portfolio.trades)
        return self.portfolio

    

        

        
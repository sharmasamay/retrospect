import numpy as np
import pandas as pd
from strategies.base import BaseStrategy
from engine.broker import Broker
from engine.portfolio import Portfolio
from typing import Optional,Dict

class SMACrossoverStrategy(BaseStrategy):
    def __init__(self, name="SMA Crossover", short_window:int=50, long_window:int=200, target_symbol:str = None,**kwargs):
        super().__init__(name, **kwargs)

        short_window = int(short_window)
        long_window = int(long_window)
        if short_window <= 0 or long_window <= 0:
            raise ValueError("SMA window periods must be positive.")
        if short_window >= long_window:
            raise ValueError("Short window must be less than long window.")
        
        self.short_window = short_window
        self.long_window = long_window
        self.target_symbol = target_symbol

        self.prices:Optional[pd.Series] = None
        self.position = 0
        self.last_short:Optional[float] = None
        self.last_long:Optional[float] = None
    
    def on_data(self, current_timestamp : pd.Timestamp, data_for_day:pd.DataFrame, portfolio:Portfolio, broker:Broker):
        if self.target_symbol is None or self.target_symbol not in data_for_day.index:
            print("The data for the ticker you're looking for is not available")
            return
        
        current_closing_price = data_for_day.loc[self.target_symbol,'Close']

        if pd.isna(current_closing_price) or current_closing_price<=0:
            return
        
        if self.prices is None:
            self.prices = pd.Series(dtype=float)
        
        self.prices = pd.concat([self.prices,pd.Series([current_closing_price])])

        if len(self.prices)> 1.5*self.long_window:
            self.prices = self.prices.iloc[-int(self.long_window*1.2):]
        
        if len(self.prices)<self.long_window:
            return
        
        short_sma = self.prices.iloc[-self.short_window:].mean()
        long_sma = self.prices.iloc[-self.long_window:].mean()

        if pd.isna(short_sma) or pd.isna(long_sma):
            return
        
        current_position_shares = portfolio.get_position(self.target_symbol)

        #Logic for buying
        if short_sma>long_sma and (self.last_short is not None and self.last_short<=self.last_long):
            if self.position==0:
                shares_to_buy = int(portfolio.cash/(current_closing_price*1.005))
                if(shares_to_buy>0):
                    broker.execute_order(current_timestamp,portfolio,self.target_symbol,'BUY',shares_to_buy,current_closing_price)
                    self.position = 1

            else:
                print(f"BUY signal is already long for {self.target_symbol} at the time of {current_timestamp}")
        
        #Logic for selling
        elif long_sma>short_sma and (self.last_long is not None and self.last_long<=self.last_short):
            if self.position==1:
                shares_to_sell = current_position_shares
                if(shares_to_sell>0):
                    broker.execute_order(current_timestamp,portfolio,self.target_symbol,'SELL',shares_to_sell,current_closing_price)
                    self.position = 0

            else:
                print(f"SELL signal is already flat for {self.target_symbol} at the time of {current_timestamp}")
        
        self.last_short = short_sma
        self.last_long = long_sma

        

        
import numpy as np
import pandas as pd
from strategies.base import BaseStrategy
from engine.broker import Broker
from engine.portfolio import Portfolio
from typing import Optional,Dict

class RSIStrategy(BaseStrategy):
    def __init__(self, name = "RSI", period:int = 14,oversold_threshold:float = 30, overbought_threshold:float = 70,target_symbol:str = None, **kwargs):
        super().__init__(name,**kwargs)

        if(period<=0):
            raise ValueError("Period needs to be a positive value")
        if(overbought_threshold<oversold_threshold):
            raise ValueError("Overbrought threshold needs to be greater than oversold threshold")
        if((overbought_threshold>100 or overbought_threshold<0) or (oversold_threshold>100 or oversold_threshold<0)):
            raise ValueError("Overbrought threshold and Oversold threshold needs to be a reasonable value")
        
        self.prices: Optional[pd.Series] = None
        self.position:int = 0
        self.last_rsi:Optional[float] = None
        self.period = period
        self.target_symbol = target_symbol
        self.oversold_threshold = oversold_threshold
        self.overbought_threshold = overbought_threshold

    def on_data(self, current_timestamp:pd.Timestamp,data_for_day:pd.DataFrame,portfolio:Portfolio, broker:Broker):
        if self.target_symbol is None or self.target_symbol not in data_for_day.index:
            print("The data for the ticker you're looking for is not available")
            return
        
        current_closing_price = data_for_day.loc[self.target_symbol,'Close']

        if pd.isna(current_closing_price) or current_closing_price<=0:
            return
        
        if self.prices is None:
            self.prices = pd.Series(dtype=float)
        
        self.prices = pd.concat([self.prices,pd.Series([current_closing_price])])

        if len(self.prices)> 2*self.period:
            self.prices = self.prices.iloc[-int(self.period*2):]
        
        if len(self.prices)<self.period+1:
            return
        
        price_changes = self.prices.diff()
        gains = price_changes.clip(lower = 0)
        losses = -price_changes.clip(upper = 0)

        avg_gain = gains.ewm(com=self.period - 1, adjust=False).mean().iloc[-1]
        avg_loss = losses.ewm(com=self.period - 1, adjust=False).mean().iloc[-1]

        if(avg_loss==0 and avg_gain==0):
            RS = np.nan
        elif(avg_loss==0):
            RS = np.inf
        else:
            RS = avg_gain/avg_loss
        
        if(RS==np.inf):
            current_rsi = 100
        elif np.isnan(RS):
            current_rsi = np.nan
            return
        else:
            current_rsi = 100 - (100/(1+RS))
        
        current_position_shares = portfolio.get_position(self.target_symbol)
        
        if current_rsi>self.oversold_threshold and (self.last_rsi is not None and self.last_rsi<=self.oversold_threshold):
            if self.position==0:
                shares_to_buy = int(portfolio.cash/(current_closing_price*1.005))
                if(shares_to_buy>0):
                    broker.execute_order(current_timestamp,portfolio,self.target_symbol,'BUY',shares_to_buy,current_closing_price)
                    self.position = 1

            else:
                print(f"BUY signal is already long for {self.target_symbol} at the time of {current_timestamp}")
        
        #Logic for selling
        elif current_rsi<self.overbought_threshold and (self.last_rsi is not None and self.last_rsi>=self.overbought_threshold):
            if self.position==1:
                shares_to_sell = current_position_shares
                if(shares_to_sell>0):
                    broker.execute_order(current_timestamp,portfolio,self.target_symbol,'SELL',shares_to_sell,current_closing_price)
                    self.position = 0

            else:
                print(f"SELL signal is already flat for {self.target_symbol} at the time of {current_timestamp}")
            
        self.last_rsi = current_rsi
        
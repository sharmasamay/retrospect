import numpy as np
from typing import Literal
from engine.portfolio import Portfolio
import pandas as pd

class Broker:
    def __init__(self,commission_per_share:float = 0.0,slippage_bps:float=0.0):
        if(commission_per_share<0):
            raise ValueError(f"Warning : Commission per share cannot be a negative value")
        if(slippage_bps<0):
            raise ValueError(f"Warning: Slippage basis points cannot be a negative value!")
        self.commission_per_share = commission_per_share
        self.slippage_bps = slippage_bps

    def execute_order(self, timestamp: pd.Timestamp, portfolio: Portfolio, symbol:str, order_type: Literal["BUY","SELL"], quantity:float,current_price:float)->tuple[float,float,float]:
        if(quantity<0):
            raise ValueError(f"Warning: The quantity cannot be a negative value.")
        if(current_price<0):
            raise ValueError(f"Warning: The current price cannot be a neagtive value.")
        if(order_type!="BUY" and order_type!="SELL"):
            raise ValueError(f"Warning: Order type is invalid.")
        fill_price = 0.0
        slippage_factor = self.slippage_bps/10000.0
        if(order_type=="BUY"):
            fill_price = current_price * (1 + slippage_factor)
        else:
            fill_price = current_price * (1 - slippage_factor)
        commission_cost = quantity*self.commission_per_share
        portfolio.process_trade(timestamp,symbol,order_type,quantity,fill_price,commission_cost)
        return(fill_price,quantity,commission_cost)
        
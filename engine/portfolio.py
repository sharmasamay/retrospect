from typing import Any, Dict, List
import pandas as pd

class Portfolio:
    def __init__(self,initial_capital: float):
        self.initial_capital = initial_capital
        self.cash = initial_capital
        self.positions: Dict[str,Dict[str,float]] = {}
        self.equity_curve_data :List[tuple[pd.Timestamp, float]] = []
        self.trades:List[Dict[str, Any]] = []
        self.current_prices:Dict[str, float] = {}
    
    def process_trade(self, timestamp: pd.Timestamp, symbol: str,trade_type: str, quantity: float, fill_price: float, commission: float):
        """Calculating the total value of the trade only"""
        trade_value = quantity*fill_price
        realized_pnl = 0.0
        """This method calculates the cash and the average price after the trade is executed"""
        if(trade_type=="BUY"):
            self.cash -= (trade_value+commission)
            if(self.cash<0): return "Cash resource depleted"
            else:
                if(symbol in self.positions):
                    old_valuation = self.positions[symbol]['quantity']*self.positions[symbol]['avg_entry_price']
                    new_average_price = (old_valuation+trade_value)/(quantity+self.positions[symbol]['quantity'])
                    self.positions[symbol]['quantity']+=quantity
                    self.positions[symbol]['avg_entry_price'] = new_average_price
                else:
                    self.positions[symbol] = {'quantity':quantity,'avg_entry_price':fill_price}
            

        else:
            if(symbol not in self.positions): return "Cash resource depleted"
            else:
                if(quantity>self.positions[symbol]['quantity']): return "Quantity available lesser than trying to sell"
                else:
                    self.cash +=(trade_value-commission)
                    realized_pnl = (fill_price - self.positions[symbol]['avg_entry_price'])*quantity
                    self.cash+=realized_pnl
                    self.positions[symbol]['quantity'] -=quantity
                    if(self.positions[symbol]['quantity']==0):
                        del self.positions[symbol]
        
        self.trades.append({
            'timestamp': timestamp,
            'symbol': symbol,
            'type': trade_type,
            'quantity': quantity,
            'price': fill_price,
            'commission': commission,
            'realized_pnl': realized_pnl
        })
        
    def get_current_value(self, current_prices:dict) -> float:
        market_value = 0.0
        for key in self.positions:
            if (key in current_prices):
                market_value+=(self.positions[key]['quantity']*current_prices[key])
            else:
                print(f"Warning: Current price for {key} not available for value calculation.")
                market_value+=(self.positions[key]['quantity']*self.positions[key]['avg_entry_price'])
        
        return self.cash+market_value
    
    def record_equity(self, timestamp:pd.Timestamp, current_prices:dict):
        current_total_value = self.get_current_value(current_prices)
        self.equity_curve_data.append((timestamp,current_total_value))

    def get_position(self, symbol: str) -> float:
        return self.positions.get(symbol, {}).get('quantity', 0.0)
    
    def get_equity_curve(self) -> pd.Series:
        if not self.equity_curve_data:
            return pd.Series([], dtype=float) # Return empty series if no data

        timestamps, values = zip(*self.equity_curve_data)
        return pd.Series(list(values), index=list(timestamps), name='Equity')
            
        


        
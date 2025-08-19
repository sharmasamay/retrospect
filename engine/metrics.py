import pandas as pd
import numpy as np

class Metrics:
    @staticmethod
    def calculate_returns(equity_curve: pd.Series) -> pd.Series:
        if not isinstance(equity_curve,pd.Series) or equity_curve.empty:
            raise ValueError("Equity curve is either empty or isn't a Pandas Series")
        if not isinstance(equity_curve.index,pd.DatetimeIndex):
            raise ValueError("Equity curve index must be a Pandas DatetimeIndex")
        
        returns = equity_curve.pct_change().dropna()
        return returns

    @staticmethod
    def calculate_drawdowns(equity_curve:pd.Series) -> pd.Series:
        if not isinstance(equity_curve,pd.Series) or equity_curve.empty:
            raise ValueError("Equity curve is either empty or isn't a Pandas Series")
        if not isinstance(equity_curve.index,pd.DatetimeIndex):
            raise ValueError("Equity curve index must be a Pandas DatetimeIndex")
        
        rolling_max = equity_curve.cummax()
        drawdown = (equity_curve/rolling_max)-1
        return drawdown

    @staticmethod
    def calculate_sharpe_ratio(returns:pd.Series, risk_free_rate =0.0, annualization_factor =252) -> float:
        if returns.empty:
            return np.nan
        
        if risk_free_rate>=-1.0:
            period_rate = ((1+risk_free_rate)**(1/annualization_factor))-1
        else:
            period_rate = risk_free_rate/annualization_factor
        
        excess_returns = returns-period_rate
        mean_excess_returns = excess_returns.mean()
        std_returns = returns.std(ddof=1)
        if(std_returns==0) or np.isnan(std_returns):
            return np.nan
        sharpe_ratio = (mean_excess_returns/std_returns)*np.sqrt(annualization_factor)
        return sharpe_ratio
    
    @staticmethod
    def performance_summary(equity_curve:pd.Series, risk_free_rate = 0.0, annualization_factor = 252, trade_count: int = 0) ->dict:
        metrics ={
            'Total Return(%)': np.nan,
            'Annualized Return(%)': np.nan,
            'Annualized Volatility (%)': np.nan,
            'Sharpe Ratio': np.nan,
            'Max Drawdown (%)': np.nan,
            'Winning Days (%)': np.nan,
            'Losing Days (%)': np.nan,
            'Trade Count': trade_count
        }

        if not isinstance(equity_curve,pd.Series) or equity_curve.empty:
            return metrics
        equity_curve = equity_curve.replace(0,np.nan).dropna()
        if equity_curve.empty or len(equity_curve)<2:
            return metrics
        
        returns = Metrics.calculate_returns(equity_curve)
        if returns.empty:
            return metrics
        
        print(returns)
        total_return = ((equity_curve.iloc[-1]/equity_curve.iloc[0])-1)*100
        metrics['Total Return(%)'] = total_return

        annualized_return = np.nan
        if(len(equity_curve)>1):
            time_span_days = (equity_curve.index[-1] - equity_curve.index[0]).days
            if(time_span_days>0):
                years = time_span_days/365.25
                if(years>0):
                    annualized_return = (((1+(total_return/100))**(1/years))-1)*100
        
        metrics['Annualized Return(%)'] = annualized_return

        annualized_volatility = returns.std(ddof=1)*np.sqrt(annualization_factor)*100
        metrics['Annualized Volatility (%)'] = annualized_volatility

        sharpe_ratio = Metrics.calculate_sharpe_ratio(returns, risk_free_rate, annualization_factor)
        metrics['Sharpe Ratio'] = sharpe_ratio

        drawdown_series = Metrics.calculate_drawdowns(equity_curve)
        max_drawdown = drawdown_series.min() * 100
        metrics['Max Drawdown (%)'] = max_drawdown

        winning_days_count = (returns > 0).sum()
        losing_days_count = (returns < 0).sum()
        total_trading_days = len(returns)

        winning_days_percent = (winning_days_count / total_trading_days) * 100 if total_trading_days > 0 else np.nan
        losing_days_percent = (losing_days_count / total_trading_days) * 100 if total_trading_days > 0 else np.nan
        metrics['Winning Days (%)'] = winning_days_percent
        metrics['Losing Days (%)'] = losing_days_percent


        return metrics


    


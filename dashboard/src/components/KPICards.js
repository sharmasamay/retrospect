import React from 'react';
import './KPICards.css';
import { useBacktest } from '../context/BacktestContext';

const KPICard = ({ title, value, color = 'blue', suffix = '', explanation = '' }) => {
  return (
    <div className="kpi-card">
      <div className="kpi-header">
        <h3 className="kpi-title">{title}</h3>
      </div>
      <div className={`kpi-value kpi-value-${color}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </div>
      {explanation && (
        <div className="kpi-explanation">
          <p className="kpi-explanation-text">{explanation}</p>
        </div>
      )}
    </div>
  );
};

export default function KPICards({ data }) {
  // Calculate additional metrics if needed
  const { backtestData, isLoading } = useBacktest();
  const totalReturn = backtestData["summary"]["Total Return(%)"] || 0;
  const annualizedReturn = backtestData["summary"]["Annualized Return(%)"] || 0;
  const annualizedVolatility = backtestData["summary"]["Annualized Volatility (%)"] || 0;
  const maxDrawdown = backtestData["summary"]["Max Drawdown (%)"] || 0;
  const sharpeRatio = backtestData["summary"]["Sharpe Ratio"] || 0;
  const totalTrades = backtestData["summary"]["Trade Count"] || 0;
  const winningDays = backtestData["summary"]["Winning Days (%)"] || 0;
  const losingDays = backtestData["summary"]["Losing Days (%)"] || 0;

  const kpiData = [
    {
        title: 'Total Return',
        value: (totalReturn).toFixed(2),
        color: totalReturn >= 0 ? 'green' : 'red',
        suffix: '%',
        explanation: `Your investment ${totalReturn >= 0 ? 'grew' : 'shrank'} by ${Math.abs(totalReturn).toFixed(2)}% overall. ${totalReturn >= 30 ? 'Amazing! Your money more than doubled in some cases.' : totalReturn >= 15 ? 'Great job! Your investment performed really well.' : totalReturn >= 5 ? 'Not bad - you made some money.' : totalReturn >= 0 ? 'You made a small profit.' : totalReturn >= -10 ? 'You lost some money, but it\'s recoverable.' : 'Significant loss - this strategy needs work.'}`
    },
    {
        title: 'Annualized Return',
        value: (annualizedReturn).toFixed(2),
        color: annualizedReturn >= 0 ? 'green' : 'red',
        suffix: '%',
        explanation: `If you kept this strategy for a full year, you'd expect to ${annualizedReturn >= 0 ? 'make' : 'lose'} about ${Math.abs(annualizedReturn).toFixed(1)}% per year. ${annualizedReturn >= 15 ? 'That\'s fantastic - much better than keeping money in a bank!' : annualizedReturn >= 8 ? 'Pretty good - beats most savings accounts and many investments.' : annualizedReturn >= 0 ? 'Modest gains, but at least you\'re not losing money.' : 'You\'d lose money each year with this approach.'}`
    },
    {
        title: 'Annualized Volatility',
        value: (annualizedVolatility).toFixed(2),
        color: annualizedVolatility <= 0.2 ? 'green' : annualizedVolatility <= 0.5 ? 'yellow' : 'red',
        suffix: '%',
        explanation: `Your returns swing up and down by about ${annualizedVolatility.toFixed(1)}% each year. ${annualizedVolatility <= 15 ? 'Very steady - like a calm ride with few surprises.' : annualizedVolatility <= 25 ? 'Moderate ups and downs - some bumpy days but manageable.' : annualizedVolatility <= 40 ? 'Quite bumpy - expect some wild swings in your account value.' : 'Very wild ride - your account could swing dramatically day to day.'}`
    },
    {
        title: 'Max Drawdown',
        value: (Math.abs(maxDrawdown)).toFixed(2),
        color: 'red',
        suffix: '%',
        explanation: `At your worst moment, you were down ${Math.abs(maxDrawdown).toFixed(1)}% from your peak. ${Math.abs(maxDrawdown) <= 5 ? 'Excellent! You barely lost any money during bad times.' : Math.abs(maxDrawdown) <= 15 ? 'Good control - your worst loss was manageable.' : Math.abs(maxDrawdown) <= 25 ? 'Moderate pain - you lost a significant chunk but recovered.' : Math.abs(maxDrawdown) <= 40 ? 'Tough times - you lost a lot at your worst point.' : 'Brutal losses - this would be very hard to stomach.'}`
    },
    {
        title: 'Sharpe Ratio',
        value: sharpeRatio.toFixed(3),
        color: sharpeRatio >= 1 ? 'green' : sharpeRatio >= 0 ? 'yellow' : 'red',
        explanation: `This measures if your gains were worth the stress. At ${sharpeRatio.toFixed(2)}, you got ${sharpeRatio >= 2 ? 'exceptional value - great returns for the risk you took!' : sharpeRatio >= 1 ? 'good value - your profits justified the ups and downs.' : sharpeRatio >= 0.5 ? 'okay value - but you might find less stressful ways to make money.' : sharpeRatio >= 0 ? 'poor value - lots of stress for little gain.' : 'terrible value - you lost money AND had a stressful ride.'}`
    },
    {
        title: 'Total Trades',
        value: totalTrades,
        color: 'blue',
        explanation: `You made ${totalTrades} trades in total. ${totalTrades >= 1000 ? 'Very active - you were buying/selling almost daily. Watch out for fees!' : totalTrades >= 250 ? 'Quite active - several trades per week on average.' : totalTrades >= 100 ? 'Moderately active - a few trades per week.' : totalTrades >= 50 ? 'Somewhat active - maybe one trade per week.' : totalTrades >= 20 ? 'Pretty quiet - just a few trades per month.' : 'Very few trades - this strategy doesn\'t trade much.'}`
    },
    {
        title: 'Winning Days',
        value: (winningDays).toFixed(1),
        color: winningDays >= 0.5 ? 'green' : 'yellow',
        suffix: '%',
        explanation: `You made money on ${winningDays.toFixed(0)}% of your trading days. ${winningDays >= 70 ? 'Incredible! You won most days - very consistent strategy.' : winningDays >= 55 ? 'Great! You won more often than you lost.' : winningDays >= 45 ? 'Balanced - you won almost as often as you lost.' : winningDays >= 35 ? 'Tough - you lost more often than you won, but big wins can still make money.' : 'Very challenging - you lost money most days.'}`
    },
    {
        title: 'Losing Days',
        value: (losingDays).toFixed(1),
        color: losingDays <= 0.5 ? 'green' : 'red',
        suffix: '%',
        explanation: `You lost money on ${losingDays.toFixed(0)}% of your trading days. ${losingDays <= 30 ? 'Excellent! You rarely had bad days.' : losingDays <= 45 ? 'Pretty good - losing days were manageable.' : losingDays <= 55 ? 'Balanced - about half your days were down days.' : losingDays <= 65 ? 'Challenging - you had more losing days than winning ones.' : 'Very tough - most of your trading days ended in losses.'}`
    }
  ];

  return (
    <div className="kpi-cards-container">
      <h3 className="kpi-section-title">Key Performance Metrics</h3>
      <div className="kpi-cards-grid">
        {kpiData.map((kpi, index) => (
          <KPICard
            key={index}
            title={kpi.title}
            value={kpi.value}
            color={kpi.color}
            suffix={kpi.suffix}
            explanation={kpi.explanation}
          />
        ))}
      </div>
    </div>
  );
}
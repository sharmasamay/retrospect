import typer, yaml, os, traceback
import pandas as pd
import numpy as np
from datetime import datetime

from utils.data_loader import load_historical_data
from utils.strategy_loader import get_available_strategies
from engine.backtester import Backtester
from engine.metrics import Metrics
#from utils.plotter import plot_equity_curves, plot_drawdowns

app = typer.Typer(help="Quantitative Backtesting Engine")

@app.command()
def run_backtests(config_file: str , output_dir: str):
    print(f"--- Starting Backtest Engine (Non-Typer Mode) ---")
    print(f"--- Loading configuration from: {config_file} ---")

    # --- 1. Load Configuration File ---
    try:
        with open(config_file, 'r') as f:
            config = yaml.safe_load(f)
        if 'experiments' not in config or not isinstance(config['experiments'], list):
            print(f"Error: Configuration file must contain a list under the 'experiments' key.")
            exit(1) # Replaced typer.Exit with exit
    except FileNotFoundError:
        print(f"Error: Config file not found at '{config_file}'.")
        exit(1)
    except yaml.YAMLError as e:
        print(f"Error parsing YAML file: {e}")
        exit(1)
    
    print(f"Loaded {len(config['experiments'])} experiment(s) from config.")

    # --- 2. Get All Available Strategies ---
    print("\nDiscovering available strategies...")
    available_strategies = get_available_strategies()
    if not available_strategies:
        print("Warning: No strategies found in configured directories. Please check strategies/library.")
    else:
        print(f"Found {len(available_strategies)} strategies: {list(available_strategies.keys())}")
    
    equity_curves = {}
    drawdown_curves = {}
    performance_summaries = []

    for i, experiment_config in enumerate(config['experiments']):
        experiment_name = experiment_config.get('name',f"Experiment_{i+1}")
        print(f"\n========================================================")
        print(f" Running Experiment: {experiment_name} ")
        print(f"========================================================")

        data_config = experiment_config.get('data',{})
        broker_settings_config = experiment_config.get('broker_settings',{})
        portfolio_settings_config = experiment_config.get('portfolio_settings',{})
        strategy_config = experiment_config.get('strategy',{})

        #Breakdown of data
        symbols = data_config.get('symbols')
        start_date = data_config.get('start_date')
        end_date = data_config.get('end_date')
        interval = data_config.get('interval')

        if not symbols or not start_date or not end_date:
            print(f"Error: Missing data parameters for experiment '{experiment_name}'. Skipping.")
            continue

        # --- Load Data ---
        print(f"Loading data for {symbols} from {start_date} to {end_date} ({interval})...")
        try:
            market_data = load_historical_data(symbols, start_date, end_date, interval)
            if market_data.empty:
                print(f"Warning: No data loaded for '{experiment_name}'. Skipping.")
                continue
            print(f"Data loaded: {market_data.shape[0]} rows, {len(market_data.index.get_level_values('Symbol').unique())} symbols.")
        except Exception as e:
            print(f"Error loading data for '{experiment_name}': {e}.")
            traceback.print_exc()
            continue

        #Strategy breakdown
        strategy_name = strategy_config.get('name')
        strategy_parameters = strategy_config.get('parameters',{})

        if not strategy_name:
            print(f"Error: Strategy 'name' missing for experiment '{experiment_name}'. Skipping.")
            continue

        if strategy_name not in available_strategies:
            print(f"Error: Strategy '{strategy_name}' not found in available strategies. Skipping.")
            print(f"Available: {list(available_strategies.keys())}")
            continue

        strategy_class = available_strategies[strategy_name]

        #Broker and portfolio settings
        commission_per_share = broker_settings_config.get('commission_per_share',0.0)
        slippage_bps = broker_settings_config.get('slippage_bps',0.0)
        initial_capital = portfolio_settings_config.get('initial_capital',100000.0)

        # --- Instantiate Strategy & Backtester and Run ---
        try:
            print(f"Instantiating strategy '{strategy_name}' with params: {strategy_parameters}")
            strategy_instance = strategy_class(**strategy_parameters) # Instantiate with parameters from config

            print(f"Running backtest for '{experiment_name}'...")
            backtester = Backtester(data=market_data,strategy=strategy_instance.__class__,initial_capital=initial_capital,commission_per_share=commission_per_share,slippage_bps=slippage_bps,symbols=symbols)
            backtester.strategy_instance = strategy_instance
            final_portfolio = backtester.run()
            print(f"Backtest for '{experiment_name}' completed.")
            equity_curve = final_portfolio.get_equity_curve()

            if interval == '1d': annualization_factor = 252
            elif interval == '1h': annualization_factor = 252 * 6.5 # Approx 6.5 trading hours/day
            elif interval == '30m': annualization_factor = 252 * 13
            else: annualization_factor = 252

            performance_summary = Metrics.performance_summary(equity_curve,risk_free_rate=0,annualization_factor = annualization_factor,trade_count=len(final_portfolio.trades))
            performance_summary['Experiment Name'] = experiment_name
            performance_summaries.append(performance_summary)
            equity_curves[experiment_name] = equity_curve

            current_drawdown = Metrics.calculate_drawdowns(equity_curve)
            drawdown_curves[experiment_name] = current_drawdown

        except Exception as e:
            print(f"Error running backtest for '{experiment_name}': {e}")
            traceback.print_exc()
            continue # Continue to next experiment even if one fails

    # --- 4. Final Reporting ---
    print("\n========================================================")
    print("                Backtest Summary Report                 ")
    print("========================================================")

    if not performance_summaries:
        print("No backtests were successfully run.")
        exit(0)
    
    summary_df = pd.DataFrame(performance_summaries)
    
    # Define desired column order for readability
    display_cols = ['Experiment Name', 'Total Return(%)', 'Annualized Return(%)', 
                    'Sharpe Ratio', 'Max Drawdown (%)', 'Annualized Volatility (%)',
                    'Winning Days (%)', 'Losing Days (%)', 'Trade Count']
    
    # Filter to only display columns that actually exist in the summary_df, to prevent KeyError
    summary_df = summary_df[[col for col in display_cols if col in summary_df.columns]]
    print(summary_df)
    
    print("\nPerformance Metrics Comparison:")
    print(summary_df.to_markdown(index=False))
    print("\n--- Backtest Engine Finished ---")

if __name__ == "__main__":
    config_file_path = "config/experiments_template.yaml" # Default config file for this script
    output_directory_path = "results"
    run_backtests(config_file=config_file_path,output_dir=output_directory_path)
            











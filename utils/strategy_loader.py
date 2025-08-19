# utils/strategy_loader.py
import importlib.util
import os
import inspect # To check if it's a class
from typing import Dict, Type # For type hinting

# Import BaseStrategy to check inheritance
# Adjust this path based on your exact file structure
from strategies.base import BaseStrategy 

def load_strategies_from_directory(directory: str) -> Dict[str, Type[BaseStrategy]]:
    """
    Scans a given directory for Python files and attempts to load classes
    that inherit from BaseStrategy.

    :param directory: The path to the directory containing strategy files.
    :return: A dictionary mapping strategy names (from strategy.name or class name)
             to their respective strategy classes.
    """
    strategies = {}
    if not os.path.exists(directory):
        print(f"Warning: Strategy directory not found: {directory}")
        return strategies

    for filename in os.listdir(directory):
        if filename.endswith(".py") and filename != "__init__.py":
            module_name = filename[:-3] # Remove .py extension
            file_path = os.path.join(directory, filename)

            # Use importlib to dynamically load the module
            spec = importlib.util.spec_from_file_location(module_name, file_path)
            if spec is None:
                print(f"Warning: Could not create module spec for {filename}. Skipping.")
                continue

            module = importlib.util.module_from_spec(spec)
            try:
                spec.loader.exec_module(module) # Execute the module's code
            except Exception as e:
                print(f"Error loading module {filename} from {directory}: {e}. Skipping.")
                continue

            # Inspect the module for classes that inherit from BaseStrategy
            for attr_name in dir(module):
                attr = getattr(module, attr_name)
                # Check if it's a class, not the BaseStrategy itself, and inherits from BaseStrategy
                if inspect.isclass(attr) and issubclass(attr, BaseStrategy) and attr is not BaseStrategy:
                    # Use the 'name' attribute from the strategy's __init__ if available,
                    # otherwise fall back to the class name.
                    strategy_key = getattr(attr, 'name', None) 
                    if strategy_key is None: # If the class doesn't have a 'name' attribute set
                        # Instantiate it temporarily just to get its default name
                        try:
                            temp_instance = attr() 
                            strategy_key = temp_instance.name
                        except TypeError: # If __init__ requires arguments, use class name
                            strategy_key = attr.__name__
                        finally:
                            del temp_instance # Clean up temp instance

                    if strategy_key in strategies:
                        print(f"Warning: Duplicate strategy name '{strategy_key}' found from {filename}. Skipping duplicate.")
                    else:
                        strategies[strategy_key] = attr
    return strategies

def get_available_strategies() -> Dict[str, Type[BaseStrategy]]:
    """
    Collects strategies from all designated strategy directories.
    """
    all_strategies = {}
    # Get the path to the strategies/library directory
    # This assumes utils/strategy_loader.py is directly under quant_backtest_engine/utils/
    # and strategies/library/ is under quant_backtest_engine/strategies/
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.join(script_dir, '..') # Go up from utils/ to quant_backtest_engine/

    # Built-in strategies from strategies/library/
    library_path = os.path.join(project_root, 'strategies', 'library')
    all_strategies.update(load_strategies_from_directory(library_path))

    # User-defined strategies (optional for now, but good to plan for)
    user_defined_path = os.path.join(project_root, 'strategies', 'user_defined')
    if os.path.exists(user_defined_path): # Only try to load if directory exists
        all_strategies.update(load_strategies_from_directory(user_defined_path))

    return all_strategies
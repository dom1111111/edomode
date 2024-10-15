from typing import Callable, get_args
from inspect import signature, _empty, getdoc
from functools import wraps

class CommandManager:
    def __init__(self):
        """Class used to create and manage commands."""
        self._command_map = {}
        self._command_alias_map = {}
        self._pre_check_command_map = {}

    ### Stuff ###

    def command(self, aliases:list=[], pre_check:Callable=None):
        """A decorator to turn a function into a command. 
        
        Decorator arguments:
        - `aliases`: a list of alternate names that can be used to invoke the command (primary name is taken from 
        the decorated function's name).
        - `pre_check`: a function which will be called before checking for a command. If the function returns a 
        truthy value, then the command will be considered open for execution.

        The function being decorated can be any existing function, but its own parameters will be used for the command 
        parameters, and return values won't be acted upon. 
        - The name of the function will become the name of the command. Underscores will be converted into spaces.
        - The docstring of the function will become the description for the command.
        - All of the function's parameters should have annotations for their type or their possible values (via 
        `typing.Literal`). Any function parameters with default values will be considered as optional, while those without 
        will be considered mandatory. If *type* annotations are used for the function parameters and there are multiple 
        (Union), then any corresponding command arguments will be converted to the the *first* type that appears in the 
        annotation. If the type conversion fails, then the subsequent types will be used for conversion until one works or 
        all fail. 
            - For example: `my_function(number:int|str)` -> this function will produce a command with a "number"
        parameter, and when the argument is passed for this, its value (most likely a string initially) will be
        converted to an integer. If this conversion doesn't work, then it will be converted to a string instead.

        If an existing function is not suitable to become a command, then a new function should be created to wrap 
        around it and provide the necessary features (annotations, etc.).
        """
        def decorator(func:Callable):
            # 1) Generate the command name:
            com_name = func.__name__.replace('_', ' ')          # get the command name the function name, and replace underscores with spaces
            # 2) Check that name and provided arguments are valid:
            assert not com_name in self._command_map.keys(), f"There is already a command with the name {com_name}. All command names must be unique."  # ensure the command name doesn't already exist in the command-map
            assert isinstance(aliases, (tuple, list))
            if pre_check:
                assert isinstance(pre_check, Callable), "The `pre_check` argument, if provided, must be a callable function or method."
            # 2a) Create entry for the aliases
            for ali in aliases:
                assert not ali in self._command_alias_map.keys(), f"There is already a command with the alias {ali}. All aliases must be unique."       # ensure none of the aliases are already used
                self._command_alias_map.update({ali: com_name})
            # 3) Generate command parameters:
            params = {}
            func_params = signature(func).parameters.items()    # get the function's parameters
            for p_name, p_details in func_params:               # get the name and details of each function parameter
                multi_vals = get_args(p_details.annotation)     # if there are multiple values or types in the annotation, then `get_args()` will produce a tuple with each 
                possible_values = multi_vals if multi_vals else p_details.annotation    # only use `multi_vals` if there is in fact multiple annotated values (not empty tuple) - otherwise use `p_details.annotation` as is
                params.update({                                 # add a dictionary for this parameter and its properties to the dictionary with all parameters
                    p_name: {
                        "val": possible_values,
                        "req": p_details.default == _empty,     # if there is no default value (default value is `_empty`), then this parameter is required (True). Otherwise, will be be optional (False)
                    }
                })
            # 4) Create the command:
            self._command_map.update(                           # add a new dict to the map for the command
                {com_name: {
                    "aliases": aliases,
                    "desc": getdoc(func),
                    "pre": pre_check,
                    "params": params,
                    "func": func
                }}
            )
            # NOTE: if you need to modify the original function, put an actual wrapper function here:
            # @wraps
            # def wrapped(*args, **kwargs):
            #     # >> extra code here <<
            #     return func(*args, **kwargs)
            # return wrapped
            return func                                         # return everything as usual for a decorator
        return decorator

    def execute_command(self, name:str, *args, **kwargs):
        func = self._command_map.get(name)
        assert func, f"There is no command with the name {name}"
        func(*args, **kwargs)



    # def run_TUI():
    #     """A simple CLI for accessing the commands"""
    #     while True:
    #         i = input('\n > Command: ').split()
    #         name, args = i[0], i[1:]
    #         if name == "exit":
    #             break
    #         func = command_map.get(name)
    #         if not func:
    #             continue
    #         func(*args)

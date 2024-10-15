from sys import argv
from pathlib import Path
from datetime import datetime
from typing import Literal, get_args
from backend import library as usr_lib
from backend import command_tools as com_tools
from server import app

######### Commands #########

cm = com_tools.CommandManager()                                 # create CommandManager object 

#########

@cm.command(aliases=["time"])
def get_time():
    """Get the current date and time."""
    time_str = datetime.now().strftime("%Y-%b-%d %I:%M:%S %p")
    print("The current date and time is: " + time_str)

#########

time_units = Literal["s", "m", "h", "second", "minute", "hour", "seconds", "minutes", "hours"]

@cm.command(aliases=["timer"])
def set_timer(quantity:float, unit:time_units="m"):
    """Set a timer.
    - `quantity`: a number (int or float) to specify the quantity of time to se the timer for.
    - `unit`: the unit of time (seconds, minutes, hours) that the quantity should apply to. If not provided, the default value is 'minutes'.
    """
    if quantity <= 0:
        # UI error print: 
        print(f'"{quantity}" is an invalid quantity. Must be a number greater than zero.')
        return
    unit = unit if unit in get_args(time_units) else 's'        # make sure that unit is within time_units Literal, otherwise set it to 's' (seconds)
    unit_val = unit[0]                                          # convert any unit string to consistent value by getting only the first letter of the string
    name_multi = {                                              # matches time unit-value to a readable name and a multiplier to convert it to seconds
        's': ("second", 1),
        'm': ("minute", 60),
        'h': ("hour", 3600)
    }
    unit_name, mutli = name_multi.get(unit_val)                 # get the readable name and seconds-multiplier from the unit-value
    unit_name = unit_name if quantity < 1 else unit_name + 's'  # make readable name plural if needed -> add "s" to end of name if quantity is greater than 1
    sec_time = (quantity * mutli)                               # get the exact time in seconds for the timer by multiplying the quantity by the unit's seconds-multiplier
    print(f"Timer set for {quantity} {unit_name} from now")
    print(sec_time)

    # create a new event for the time

    # timer_val = timedelta(seconds=total_seconds)
    # while timer_val.seconds > 0:
    #     print(timer_val, end='\r')
    #     sleep(1)
    #     timer_val -= timedelta(seconds=1)
    # message_print("TIMER COMPLETE")

#########

# !! MODIFY THESE !!: 

# def get_entries():
#     """Get all entries in a library."""
#     request_data = request.get_json()
#     request_data.update({"lib_dir": lib_path})          # must add library directory into request
#     entries = usr_lib.get_all_entries(**request_data)
#     return jsonify(entries)

# def new_entry():
#     """Create a new entry in a library."""
#     request_data = request.get_json()
#     request_data.update({"lib_dir": lib_path})
#     # request_data should already be formatted correctly to match function as is!
#     usr_lib.create_entry(**request_data)
#     return jsonify(None)


######### App Starting Script #########

if __name__ == "__main__":
    try:
        lib_path = argv[1]
    except:
        # if no library folder path is provided, then use the test_library folder as a default
        lib_path = Path(__file__).parent.parent / "_test_library"

    app.run(debug=True)                                 # this is blocking (so must run other stuff in threads)
        # `debug=True` should only be while testing!

#######

# print()

# set_timer(2, 'hours')

# get_time()

# print()

# from pprint import pprint

# pprint(cm._command_map)

# print()

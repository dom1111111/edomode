from datetime import datetime
from typing import Literal
from backend.command_manager import CommandManager

cm = CommandManager                                             # create CommandManager object 

@cm.command("time")
def get_time():
    time_str = datetime.now().strftime("%Y-%b-%d %I:%M:%S %p")
    return "The current date and time is: " + time_str

@cm.command("timer")
def set_timer(quantity:float, unit:Literal["second", "minute", "hour"]="second"):
    multiplier = {
        's': 1,
        'm': 60,
        'h': 60 * 60
    }
    unit = unit if unit in multiplier.keys() else 's'           # make sure that unit is within the multiplier map, otherwise set it to 's' (seconds)
    total_seconds = (float(quantity) * multiplier.get(unit))

    # unit_word = (get proper word from unit, add 's' if quantity more than 1)
    # return f"timer set for {quantity} {unit_word} from now"

    # DO NOTHING IS QUANTITY IS 0
    # create a new event for the time

    # timer_val = timedelta(seconds=total_seconds)
    # while timer_val.seconds > 0:
    #     print(timer_val, end='\r')
    #     sleep(1)
    #     timer_val -= timedelta(seconds=1)
    # message_print("TIMER COMPLETE")


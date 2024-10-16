from flask import Flask, request, jsonify, send_from_directory, Response
from queue import Queue
import json
from sys import argv
from pathlib import Path
from backend import command_tools


######### Command Setup #########

cm = command_tools.CommandManager()                         # create CommandManager object to hold all commands


######### Main Flask Server Code #########

app = Flask(__name__)

### Initial Page Loading ###

@app.route('/')
def get_main_page():
    return send_from_directory(app.static_folder, "index.html")

### SSE Functions ###

UI_MESSAGES = Queue()

def format_sse_msg(data:str|dict, event:str=None) -> str:
    """Converts data to the correct format for Server-Sent-Events (SSE)."""
    data = json.dumps(data)                                 # convert data to JSON string
    msg = f'data: {data}\n\n'                               # the beginning of an single piece of data is denoted with `data:`, and the end is denoted with 2 line-breaks
    if event:
        msg = f'event: {event}\n{msg}'                      # can specify events to trigger in the client (ex: HTML element events, where `EventListener`s are waiting for them)
    return msg

def send_ui_action_msg(action:str, data:list):
    """Send a message to the front-end UI, telling it to perform an action."""
    assert isinstance(action, str)
    assert isinstance(data, list)                           # this MUST be a list, representing an array of positional arguments
    action_msg = {
        "action": action,
        "data": data
    }
    UI_MESSAGES.put(action_msg)

@app.route('/stream-ui-msgs')
def stream_ui_action_msgs():
    """Use to get UI events via SSE mechanism."""
    def get_ui_msgs():
        while True:
            ui_msg = UI_MESSAGES.get()
            yield format_sse_msg(ui_msg)
    return Response(get_ui_msgs(), mimetype='text/event-stream')

### Main Endpoint for Command Access

def get_entries():
    """Get all entries in a library."""
    request_data = request.get_json()
    request_data.update({"lib_dir": lib_path})          # must add library directory into request
    entries = usr_lib.get_all_entries(**request_data)
    return jsonify(entries)

def new_entry():
    """Create a new entry in a library."""
    request_data = request.get_json()
    request_data.update({"lib_dir": lib_path})
    # request_data should already be formatted correctly to match function as is!
    usr_lib.create_entry(**request_data)
    return jsonify(None)

@app.route('/command', methods=["POST"])
def execute_command():
    """Execute a command."""
    request_data = request.get_json()
    assert isinstance(request_data, dict), "HTTP requests must be in JSON object format"
    name = request_data.get('name')
    args = request_data.get('args')
    kwargs = request_data.get('kargs')
    cm.execute_command(name, *args, **kwargs)
    # DETERMINE IF COMMAND RETURNS ANYTHING OR WILL MAKE REQUESTS LATER
    return jsonify()


######### App Starting Script #########

if __name__ == "__main__":
    try:
        lib_path = argv[1]
    except:
        # if no library folder path is provided, then use the test_library folder as a default
        lib_path = Path(__file__).parent.parent / "_test_library"

    app.run(debug=True)                                 # this is blocking (so must run other stuff in threads)
        # `debug=True` should only be while testing!

from flask import Flask, request, jsonify, send_from_directory, Response
from queue import Queue
import json

######### Main Flask Server Code #########

app = Flask(__name__)

### Support Functions ###



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

def send_ui_msg(action:str, data:str):
    """Send a message to the front-end UI, telling it to perform an action."""
    action_msg = {
        "action": action,
        "data": data
    }
    UI_MESSAGES.put(action_msg)

@app.route('/stream-ui-msgs')
def stream_ui_msgs():
    """Use to get UI events via SSE mechanism."""
    def get_ui_msgs():
        while True:
            ui_msg = UI_MESSAGES.get()
            yield format_sse_msg(ui_msg)
    return Response(get_ui_msgs(), mimetype='text/event-stream')

### Main Endpoint for Command Access

@app.route('/command', methods=["POST"])
def execute_command():
    """Execute a command."""
    request_data = request.get_json()
    assert isinstance(request_data, dict), "HTTP requests must be in JSON object format"
    request_data.get()
    return jsonify()

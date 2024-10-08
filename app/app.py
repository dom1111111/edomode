from sys import argv
from flask import Flask, request, jsonify, send_from_directory
from pathlib import Path
from backend import library as usr_lib

######### Data #########


######### Main Flask Server Code #########

app = Flask(__name__)

### Support Functions ###



### Initial Page Loading ###

@app.route('/')
def get_main_page():
    return send_from_directory(app.static_folder, "index.html")

### Main Library-Data Send/Receive AJAX Functions ### 

@app.post('/lib/all')
def get_entries():
    """Get all entries in a library."""
    request_data = request.get_json()
    entries = usr_lib.get_all_entries(**request_data)
    return jsonify(entries)

@app.post('/lib/new')
def new_entry():
    """Create a new entry in a library."""
    request_data = request.get_json()
    # request_data should already be formatted correctly to match function as is!
    usr_lib.create_entry(**request_data)
    return ""


######### Starting Script #########

if __name__ == "__main__":
    try:
        lib_path = argv[1]
    except:
        # if no library folder path is provided, then use the test_library folder as a default
        lib_path = lib_path = Path(__file__).parent.parent / "_test_library"
    app.run(debug=True)                 # `debug=True` should only be while testing!

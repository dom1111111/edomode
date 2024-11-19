from flask import Flask, request, jsonify, send_from_directory
from sys import argv
from pathlib import Path
from backend import library as usr_lib

######### Data #########

APP_DIR = Path(__file__).parent                             # the path of the application directory 
    # (gotten from this script, which should ALWAYS be in the top level of the project dir)


######### Main Flask Server Code #########

app = Flask(__name__)

###### Initial Page Loading ######

@app.route('/')
def get_main_page():
    return send_from_directory(app.static_folder, "index.html")

###### Endpoint Functions ######

@app.route('/error-test', methods = ['POST'])
def error_test():
    x = 3 / 0
    return jsonify(x)

### Library Access ###

@app.route('/lib/recent', methods = ['POST'])
def get_n_recent_entries():
    """Get recent entries in a library."""
    request_data = request.get_json()
    n = request_data['n']                                   # get n -> the number of recent entries to return   
    entries = usr_lib.get_entries_by_patterns(lib_path, sort_props=('time', 'DSC'), n=n)    # get the `n` most recent entries
    return jsonify(entries)

@app.route('/lib/search', methods = ['POST'])
def get_entries_by_search():
    """Get all entries in a library which match a search query, sorted by most to least recent."""
    request_data = request.get_json()
    patterns = request_data['patterns']                     # get the patterns dict from the request data
    entries = usr_lib.get_entries_by_patterns(lib_path, patterns, [('MATCHSCORE', 'DSC'), ('time', 'DSC')]) # get the matching entries, sorted by match score and recentness 
    return jsonify(entries)

@app.route('/lib/new', methods = ['POST'])
def new_entry():
    """Create a new entry in a library."""
    entry_props = request.get_json()                        # the value parsed from the request should be a dictionary of all of the entry properties
    usr_lib.create_entry(lib_path, entry_props)             # create the entry with the library module, adding library path
    return jsonify(None)


######### App Starting Script #########

if __name__ == "__main__":
    try:
        lib_path = argv[1]
    except:
        # if no library folder path is provided, then use the test_library folder as a default
        lib_path = Path(__file__).parent.parent / "_test_library"
    
    usr_lib.validate_library(lib_path)                      # make sure the user library is valid before starting the app

    app.run(debug=True)                                     # this is blocking (so must run other stuff in threads)
        # `debug=True` should only be while testing!

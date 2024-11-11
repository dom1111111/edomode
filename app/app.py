from flask import Flask, request, jsonify, send_from_directory, Response
from queue import Queue
import json
from sys import argv
import traceback
from functools import wraps
from textwrap import dedent
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
    entries = usr_lib.get_n_recent_entries(lib_path, n)     # get the `n` most recent entries, adding library path
    return jsonify(entries)

@app.route('/lib/search', methods = ['POST'])
def get_entries_by_search():
    """Get all entries in a library which match a search query, sorted by most to least recent."""
    request_data = request.get_json()
    query = request_data['query']                           # get the search string
    patterns = {'title': query, 'tags': query, 'content': query}    # create a patterns dict which applies the search string to the main entry properties
    entries = usr_lib.get_entries_by_patterns(lib_path, patterns, [('MATCHSCORE', 'DSC'), ('time', 'DSC')]) # get the matching entries, sorted by match score and recentness 
    return jsonify(entries)

@app.route('/lib/new', methods = ['POST'])
def new_entry():
    """Create a new entry in a library."""
    entry_props = request.get_json()                        # the value parsed from the request should be a dictionary of all of the entry properties
    title = entry_props.pop("title")                        # remove the title property from the entry properties, and get its value
    usr_lib.create_entry(lib_path, title, entry_props)      # create the entry with the library module, adding library path
    return jsonify(None)


######### App Starting Script #########

if __name__ == "__main__":
    try:
        lib_path = argv[1]
    except:
        # if no library folder path is provided, then use the test_library folder as a default
        lib_path = Path(__file__).parent.parent / "_test_library"

    app.run(debug=True)                             # this is blocking (so must run other stuff in threads)
        # `debug=True` should only be while testing!

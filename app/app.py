from flask import Flask, request, jsonify, send_from_directory, Response
from queue import Queue
import json
from sys import argv
import traceback
from functools import wraps
from textwrap import dedent
from pathlib import Path
from backend import library as usr_lib


######### Support Functions #########

APP_DIR = Path(__file__).parent                     # the path of the application directory 
    # (gotten from this script, which should ALWAYS be in the top level of the project dir)

def get_exception_info(e: Exception) -> dict:
    """Get a dictionary containing information about an exception.
    All values will be a string or an int."""
    tb = traceback.extract_tb(e.__traceback__)[-1]  # get the last entry of traceback summary of the exception (which is the exact source of the error)
    err_info = {                                    # a dictionary to hold information about the error/exception that occured
        'code':     tb[3],                          # the line of code that the error occurred at (third element of the traceback entry)
        'name':     e.__class__.__name__,           # the name/type of the error
        'message':  str(e),                         # the error message
        'file':     Path(tb[0]).relative_to(APP_DIR.parent),    # the relative path of the file the error occurred in (first element of the traceback entry)
        'line':     tb[1],                          # the line number of the code in the file that the error occured at (second element of the traceback entry)
        'tb_str':   ''.join(traceback.format_exception(e))  # a string of the full traceback for the exception
    }
    return err_info

def handle_exception(func):
    """A wrapper/decorator to execute a provided flask endpoint function 
    in a try/except block (so the function should be decorated with flask
    app object AFTER this). If an exception occurs, will return a JSON 
    response containing error information which the front-end understands."""
    @wraps(func)                                    # this is needed, otherwise Flask throws an error!    
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:                      # If exception is raised during execution of wrapped function,
            err_info = get_exception_info(e)        # then extract data from the exception
            err_msg = dedent(f"""
                {err_info['name']}: {err_info['message']}
                - code: `{err_info['code']}` 
                - line: {err_info['line']}
                - file: "${err_info['file']}"
                """)                                # then create a message to display some of the exception data
            return jsonify({"ERROR": err_msg})      # return the message as JSON -> any object returned which has a single "ERROR" key will be correctly handled by front-end as an error
    return wrapper


######### Main Flask Server Code #########

app = Flask(__name__)

### Initial Page Loading ###

@app.route('/')
def get_main_page():
    return send_from_directory(app.static_folder, "index.html")

### Main Endpoint Functions ###

@app.route('/lib/error-test', methods = ['POST'])
@handle_exception
def error_test():
    x = 3 / 0
    return jsonify(x)

@app.route('/lib/all', methods = ['POST'])
@handle_exception
def get_entries():
    """Get all entries in a library."""
    request_data = request.get_json()
    request_data.update({"lib_dir": lib_path})      # must add library directory into request
    entries = usr_lib.get_all_entries(**request_data)
    return jsonify(entries)

@app.route('/lib/new', methods = ['POST'])
@handle_exception
def new_entry():
    """Create a new entry in a library."""
    request_data = request.get_json()
    request_data.update({"lib_dir": lib_path})
    # request_data should already be formatted correctly to match function as is!
    usr_lib.create_entry(**request_data)
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

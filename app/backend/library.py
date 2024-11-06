from pathlib import Path
import json

########################
######### Data #########
########################

# The relative paths for each base library file/directory component: 
_DATA_DIR = Path(".data")
_FILE_PATHS = {
    'database': _DATA_DIR / "database.json",
    'settings': _DATA_DIR / "settings.json",
}

# File characters that cannot be in filenames:
_ILLEGAL_FILE_CHARS = '<>:"/\|?*'

# The properties which ALL entries MUST have:
_BASE_PROPERTIES = {
    # 'title': str,                               # 'title' is the identifying property - must be unique for all entries across all types
    'time': int,                                # 'time' will be a timestamp (seconds since the Epoch) for creation time
    'type': ("note", "page", "task")            # 'type' can be one the values in this tuple
}


#####################################
######### Support Functions #########
#####################################

### Database File Read/Write ###

def _read_database(lib_path:Path) -> dict[str, dict]:
    db_path = lib_path / _FILE_PATHS['database']# create path to database file
    with open(db_path, 'r') as f:
        return json.load(f)                     # read the db JSON file - return list of the db

def _write_database(lib_path:Path, db_data:dict):
    db_path = lib_path / _FILE_PATHS['database']# create path to database file
    with open(db_path, 'w') as f:
        json.dump(db_data, f, indent=3)         # write the the entries data back to the db file

### Library Setup/Validation ###

def _validate_library(lib_dir:str) -> Path:
    """Ensure that the provided library path string (lib_dir) is an existing directory 
    and has all needed sub-dirs/files for a library. Then return `Path` object of the string."""
    lib_path = Path(lib_dir)
    assert lib_path.is_dir(),f"{lib_dir} is not an existing directory"  # make sure that the provided directory already exists
    # Create all of the data dirs/files if they don't already exist in the library:
    data_dir = lib_path / _DATA_DIR
    if not data_dir.exists():                   # make sure `.data` dir exists
        data_dir.mkdir()
    for p in _FILE_PATHS.values():
        full_path = lib_path / p
        if (not full_path.exists()) or (full_path.stat().st_size == 0): # if the files don't exist or they're empty, make write new files
            # [THIS BLOCK NEEDS FIXING]
            with open(full_path, 'w') as f:
                if p == _FILE_PATHS.get("database"):
                    initial_data = {
                        # "First": {
                        #     "type":
                        # }
                    }
                    json.dump(initial_data, f, indent=1)   # if this is the path is for the database file, then create a JSON file with an initial entry log
                elif p.suffix == ".json":
                    json.dump({}, f, indent=1)  # if the path specifies a JSON file, create JSON with an empty dictionary (object)
                else:
                    f.write()                   # otherwise just create an empty file
    # Return Path object of library dir string:
    return lib_path

def _validate_entry_data(entry_data:dict):
    """Ensure that an entry has all valid properties and values."""
    # 1) First make sure the base properties are present and have valid values:
    for name, correct_val in _BASE_PROPERTIES.items():
        # make sure the base property is present in entry-data:
        assert name in entry_data.keys(), f'this entry is missing the "{name}" property, a base properties which all entries must have:\n{entry_data}'
        # then make sure the entry-data property has the correct value:
        wrong_type_err_msg = f'this entry has an invalid value for its "{name}" property:\n{entry_data}'
        entry_prop_val = entry_data[name]
        if isinstance(correct_val, type):       # if the model value is a 'type', then make sure the entry-data's value is of that same type
            assert isinstance(entry_prop_val, correct_val), wrong_type_err_msg
        else:                                   # otherwise (model value is a sequence of values), make sure entry-data's value is in the sequence of values
            assert entry_prop_val in correct_val, wrong_type_err_msg
    # 2) Then check the properties based on type:
    entry_type = entry_data["type"]
    # NOTE: add code for each to make sure it has the minimum props it needs (base + any extras)
    # but ALSO, make sure it doesn't have any props it shouldn't have (ex: notes and logs can 
    # have content, but don't need to. However, they CAN'T have a due-date! (only tasks can))
    if entry_type == "log":
        pass
    elif entry_type == "note":
        pass
        # must have these props: (base)
    elif entry_type == "task":
        pass

### Support For Read Operations ###

def _tokenize(pattern:str) -> list[str]:
    """Split a string into a list of tokens, splitting at whitespace characters OR at
    sections surrounded by quotes. Also removes any duplicate tokens.
    - ex: `hello world and "goodbye world"` will be returned as:
    `["hello", "world", "and", "goodbye world"]`
    - `hello big"blue"world` will return as `["hello", "big", "blue", "world"]`
    """
    tokens = []
    tok = ''
    for char in pattern:                        # iterate through all characters in the pattern string
        quoted = tok.startswith('"')            # determine if current token is quoted or not
        if (char.isspace() and not quoted) or (char == '"' and quoted):
            # Proceed if the current character is a whitespace (including \n, etc.) and the current token 
            # is not quoted - OR - if the current character is a quote and the current token is quoted 
            # (means this is the end of the quoted section).
            if tok:                             # only add current token if it's not empty
                if quoted:
                    tok = tok.strip('"')        # if the token is quoted, remove any starting or trailing quote characters, but nothing else
                tokens.append(tok)              # append the current token to the list of tokens
                tok = ''                        # reset the current token to be an empty string
        else:
            tok += char                         # if the character isn't whitespace or the end of a quote, add it to current token
    
    return list(set(tokens))                    # remove any duplicates in tokens list, and then return

def _does_pattern_match_value(pattern:str, value:str|int|float):
    """
    The search pattern syntax is relatively simple and follows these rules:
    - the overall pattern string is broken up by whitespace into tokens (EXCEPT 
    for any part surrounded by quotes). The value will be considered a match if 
    it contains any of the tokens.
        - ex: `eat a bagel` will match all values which contain `eat`, `a`, and/or `bagel`,
        but `"eat a bagel"` will only include values which contain `eat a bagel` exactly.
    - prepending any of the individual tokens with `!` will ensure that value must NOT
    contain that token, and prepending with `*` will ensure that the value MUST contain
    the token.
        - ex: `*eat a !bagel` will match values which contain `eat`, may or may not contain `a`, 
        and do not contain `bagel`.
    - prepending the a token with `#` will denote a special pattern can be used to match values 
    which contain numbers (so not strings). The `!` and `*` prefixes do nothing in this case. Also,
    the token must not contain any other characters other than the numbers
    Here's examples of the syntax:
        - `#0-9` matches any number between 0 and 9, including 0 and 9
        - `#>9` means any number greater than 9 and `#<9` means any number less than 9, including negatives
        - `#9` means any number which is just equal to 9
    - any token prepended with `/` will ignore the `/` character itself and negate the possible effects of 
    the character after it.
        - ex: `/*hi* there` will become `["*hi*", "there"]`, and the initial `*` will be ignored
        - and `//nhey` will become `/nhey` - allowing a `/` to stay
    """
    # 1) split the pattern string into tokens, according to whitespace and quotes
    tokens = _tokenize(pattern)
    ptrn_matches = 0                            # the number of times the value contained/matched a token in the pattern
    for tok in tokens:
        # Exclusion Prefix:
        if tok.startswith('!') and tok[1:] in value:
            return False                        # if the the pattern token starts with the exclusion prefix, and the value contains this token, return False (value contains pattern which must not be present)
        # Inclusion Prefix:
        elif tok.startswith('*') and not tok[1:] in value:
            return False                        # if the the pattern token starts with the inclusion prefix, and the value does not contain this token, return False (value doesn't contain pattern which must be present)
        # Number Prefix:
        elif tok.startswith('#'):
            if not isinstance(value, (int, float)):
                continue                        # if the pattern specifies value to match number(s), and the value is not a number (int or float type), then continue to next token (value is incorrect type)
            n_ptrn = tok[1:]                    # remove the `#` prefix from pattern token to isolate the number matching syntax
            # if `-` is in pattern, treat it as number range check:
            if '-' in n_ptrn:
                try:                            # convert each number character in pattern to list of floats
                    n = (float(x) for x in n_ptrn.split('-'))
                except:
                    continue                    # if conversion fails, continue to next token (wrong syntax was used)
                if value > n[0] and value < n[0]:
                    ptrn_matches += 1           # if the value is within the range specified by the pattern, increment the number of pattern matches
            # if the pattern contains `>` or `<`, then treat it as a great-than/less-than check:
            elif ('>' in n_ptrn) or ('<' in n_ptrn):
                n = n_ptrn[1]                   # isolate the number to check value against
                try:
                    n = float(n)                # convert number to float
                except:
                    continue                    # if conversion fails, continue to next token (wrong syntax was used)
                if '>' in n_ptrn and value > n:
                    ptrn_matches += 1           # if `>`, increment the number of pattern matches if value is greater-than the number to check against
                elif '<' in n_ptrn and value < n:
                    ptrn_matches += 1           # if `<`, increment the number of pattern matches if value is less-than the number to check against
            # otherwise, if just a single number:
            else:
                try:
                    n = float(n)                # convert number to float
                except:
                    continue                    # if conversion fails, continue to next token (wrong syntax was used)
                if value == n:
                    ptrn_matches += 1           # increment the number of pattern matches if the value is equal to the number
        # No Prefix (or `/`):
        else:
            if tok.startswith('/'):
                tok = tok[1:]                   # remove any starting slashes from token
            if tok in value:
                ptrn_matches += 1               # simply, if the token is in the value, increment the number of pattern matches
    
    return ptrn_matches                         # finally, return the number of pattern matches

def _convert_entries_to_list(entries:dict) -> list[dict]:
    """Convert a dictionary of entries to a list of entries, where each entry
    is a dictionary with all of the existing entry properties, but with an added
    "title" property coming from the initial dictionary's key."""
    return [dict({"title": key}, **val) for key, val in entries.items()]
        # ^ Iterate through each key, value of the `entries` dict add a new dict to
        # the list which contains the existing value dict but also add a "title" 
        # property to the new dict, which comes from the key.

### Support For Library User File Operations ###

def _get_valid_absolute_lib_path(lib_dir:str, path:str) -> Path:
    """Get a full absolute file path in the library directory (`lib_dir`)
    - `path` is the *relative* path where the file should exist in the library,
    including the file name, extension, and any container directories.
        - Will raise error if it leads to the protected library data dirs.
    """
    lib_dir_obj = Path(lib_dir)                             # first convert both path strings to Path objects
    path_obj = Path(path)
    if path_obj.is_absolute():
        path_obj = Path(*path_obj.parts[1:])                # if `path` is absolute, make it relative (remove the root)
    if path_obj.parts[0] == _DATA_DIR:
        raise Exception("You cannot read/write a file in the library's reserved data directory.")
    return lib_dir_obj / path_obj                           # create a full absolute path by combining the library directory with the relative path for the file
    
#########################################################
######### Main Functions for Library User Files #########
#########################################################

def create_file(lib_dir:str, path:str, data:str|bytes=""):
    """Create a new file in a library folder.
    - `path` is the *relative* path that the file should exist in the library,
    including the file name, extension, and any container directories. If the 
    directories in this path do not exist, then they will created.
        - Will raise error if it already exists as a file, or if it leads to any 
        protected library data files/dirs.
    - `data` is the file data that will be written to the file. (defaults to empty string)
    """
    # 1) Prepare and validate path:
    full_path = _get_valid_absolute_lib_path(lib_dir, path) # get a valid full absolute library path
    if full_path.is_file():
        raise FileExistsError(f"""The "{path}" file cannot be created, as it already exists in this library.""")
    full_path.parent.mkdir(parents=True, exist_ok=True)     # if path had any directories between the file and the library directory, then this will create any which don't exist, and leave alone any which do
    # 2) Create the file:
    if isinstance(data, str):
        full_path.write_text(data)                          # if the data is a string, then create file and write data as text
    elif isinstance(data, bytes):
        full_path.write_bytes(data)                         # or if the data is bytes, then create file and write data as bytes

def read_file(lib_dir:str, path:str, text:bool=True) -> str|bytes:
    """Get the contents of an existing file in the library.
    - `path` is the *relative* path where the file exists in the library.
        - Will raise error if it doesn't exist as a file, or if it leads to any 
        protected library data files/dirs.
    - `text` is a boolean that if True, will read the file as text, or if False,
    will read the file as bytes.
    """
    full_path = _get_valid_absolute_lib_path(lib_dir, path) # get a valid full absolute library path
    if text:
        return full_path.read_text()                        # read and return the file content as either text or bytes depending on `text` arg bool value
    return full_path.read_bytes()                           # -> either will raise error if it doesn't exist

def edit_file(lib_dir:str, path:str, new_path:str=None, data:str|bytes=None):
    """Edit an existing file in a library folder. 
    - `path` is the *relative* path where the file exists in the library.
        - Will raise error if it doesn't exist as a file, or if it leads to any 
        protected library data files/dirs.
    - `new_path` (if provided) will be the path that the file will be renamed to.
        - Will raise error if it already exists as a file, or if it leads to any 
        protected library data files/dirs.
    - `data` (if provided) will be the new contents for the file, rewriting the old contents.
    """
    # 1) Prepare and validate path:
    full_path = _get_valid_absolute_lib_path(lib_dir, path) # get a valid full absolute library path
    if not full_path.is_file():
        raise FileNotFoundError(f"""The path "{path}" does not exist or is not a file in this library.""")
    # 2) Rename the file if a new path was provided:
    if new_path:
        new_full_path = _get_valid_absolute_lib_path(lib_dir, new_path) # get a valid full absolute library path
        if new_full_path.is_file():
            raise FileExistsError(f"""The file cannot be renamed to "{new_path}", as it already exists in this library.""")
        new_full_path.parent.mkdir(parents=True, exist_ok=True) # if path had any directories between the file and the library directory, then this will create any which don't exist, and leave alone any which do
        full_path.rename(new_full_path)                     # rename the path to be the new path
    # 3) Rewrite the file if data was provided
    if data:
        if isinstance(data, str):
            full_path.write_text(data)                      # if the data is a string, then create file and write data as text
        elif isinstance(data, bytes):
            full_path.write_bytes(data)                     # or if the data is bytes, then create file and write data as bytes


    full_path.parent.mkdir(parents=True, exist_ok=True)     # if path had any directories between the file and the library directory, then this will create any which don't exist, and leave alone any which do
    # 2) Create the file:
    if isinstance(data, str):
        full_path.write_text(data)                          # if the data is a string, then write data as text
    elif isinstance(data, bytes):
        full_path.write_bytes(data)                         # or if the data is bytes, then write data as bytes

def delete_file(lib_dir:str, path:str):
    """Delete an existing file in the library.
    - `path` is the *relative* path where the file exists in the library.
        - Will raise error if it doesn't exist as a file, or if it leads to any 
        protected library data files/dirs.
    """
    full_path = _get_valid_absolute_lib_path(lib_dir, path)
    full_path.unlink()                                      # delete the file (will raise error if it doesn't exist)

######################################################
######### Main Functions for Library Entries #########
######################################################

### Write Functions  - Create, Edit, Delete ###

def create_entry(lib_dir:str, title:str, entry_data:dict):
    """Create a new entry in a library. `title` is a string for the entry's title, and 
    `entry_data` must be dictionary which includes all of the properties and their values 
    that the entry should have (these must include the base properties)."""
    # 0) Validate the library directory path string and the entry:
    lib_path = _validate_library(lib_dir)       # ensure library directory is set up properly
    _validate_entry_data(entry_data)            # ensure that the entry has valid properties
    # 1) Read the database and ensure that the title doesn't already exist:
    entries = _read_database(lib_path)          # read database file and get entries dict
    assert not title in entries.keys(), f'Cannot create new entry with the title "{title}". An entry already has this title.'
    # 2) Add the entry to the database:
    entries.update({title: entry_data})
    _write_database(lib_path, entries)          # write the modified dict back to database file

def update_entry(lib_dir:str, title:str, new_title:str=None, entry_data:dict={}):
    """Overwrite an existing entry in a library database.
    - `title`: the current title of the entry to edit
    - `new_title`: (if provided) title to replace the existing title 
    - `entry_data`: (if provided) a dictionary with the property names and values which will 
    overwrite the existing ones. If a property isn't included here, then the existing 
    property value will be left as is."""
    # 0) Validate the library directory and read database:
    lib_path = _validate_library(lib_dir)       # ensure library directory is set up properly
    entries = _read_database(lib_path)          # read database file and get entries dict
    assert title in entries.keys(), f"""Cannot update this entry with title "{title}". It doesn't exist in database"""
    # 1) If a new title is provided, then ensure it doesn't already exist, and remove it from the db dict:
    if new_title and (new_title != title):
        assert not new_title in entries.keys(), f'Cannot update entry with the new title "{new_title}". An entry already has this title.'
        old_data = entries.pop(title)
        title = new_title
    else:
        old_data = entries.get(title)
    # 2) Update the old entry data dict with the new one, and validate it
    new_data = old_data.update(entry_data)
    _validate_entry_data(new_data)              # ensure that the updated entry has valid properties
    # 3) Finally add updated entry back to the database:
    entries.update({title: new_data})
    _write_database(lib_path, entries)          # write the modified dict back to database file
    
def delete_entry(lib_dir:str, title:str):
    """Delete the entry whose title is `title`. If entry doesn't exist, does nothing"""
    lib_path = _validate_library(lib_dir)       # ensure library directory is set up properly
    entries = _read_database(lib_path)          # read database file and get entries dict
    entries.pop(title, None)                    # remove the entry with `title` from the db dict
    _write_database(lib_path, entries)          # write the modified dict back to database file

### Read Functions ###

def get_all_entries(lib_dir:str):
    """Get all of the entries in a library."""
    lib_path = _validate_library(lib_dir)       # ensure library directory is set up properly
    return _convert_entries_to_list(_read_database(lib_path))   # get entries dict from reading database file, convert to list, and return

def get_n_recent_entries(lib_dir:str, n:int):
    """Get a maximum of `n` most recent entries in a library."""
    lib_path = _validate_library(lib_dir)       # ensure library directory is set up properly
    entries = _read_database(lib_path)          # read database file and get entries dict
    entries_list = _convert_entries_to_list(entries)    # convert the entries dictionary to a list 
    if len(entries_list) <= n:
        return entries_list                     # if the total number of entries is less than `n`, just return all of them
    return entries_list[-n:]                    # otherwise return the last `n` entries

def get_entries_by_title(lib_dir:str, titles:list[str]):
    """Get a dictionary of entries whose title's match those in the `titles` list arg."""
    lib_path = _validate_library(lib_dir)       # ensure library directory is set up properly
    entries = _read_database(lib_path)          # read database file and return entries dict
    # Create and return a new list containing only those entries whose title's are in `titles` list
    # and also add the title as as a "title" property to each entry dict in the list:
    return [dict({'title':title}, **data) for title, data in entries.items() if title in titles]
    
def get_entries_by_query(lib_dir:str):

    # MAKE THIS NOT HAVE ANY SORT PROPERTIES. Sorting can be done by 

    # ALSO NEEDS TO ADJUST CODE TO HANDLE `title` BEING OUTSIDE OF THE ENTRY DATA DICT

    pass

# def get_entries_by_query(
#         library_dir:str, 
#         patterns:dict=None, 
#         sort_prop:str='name', 
#         ascending:bool=True, 
#         n:int=100
#     ) -> list[dict]:
#     """Get a dictionary containing all entries within a library (`library_dir`) whose properties 
#     match a search pattern string.

#     - `patterns` should be a dictionary where the keys are entry property names, and the values 
#     are pattern strings which the value of the entry's property should match (if `patterns` is 
#     None, then only the sorting mechanic will be applied)
#         - > for a description of the of how match patterns work, see the docstring for the 
#     `_does_pattern_match_value()` function.

#     - `sort_prop` must be the name of the entry property (str) which should be used for sorting
#     the matched entries ("name" is the default property to sort by)
    
#     - `ascending` is a bool to specify if the matched entries should be sorted in ascending (True) 
#     or descending order (False).
    
#     - `n` specifies the maximum number of sorted entries to return.
    
#     So for example if you wanted to find the 50 most recent entries whose names contain "hello", 
#     you could use: `patterns = {'name': "hello"}, sort_by_prop = 'time', sort_ascending = False, n = 50`
#     """
#     # 0) Load Database:
#     lib_path = _validate_library(library_dir)   # ensure library directory is set up properly, and set it up if not
#     database = _read_database(lib_path)          # read the db file - get list of the db
#     matched_entries = []                        # this will be the list which holds all matching entries from the database
    
#     # 1) Check each entry to see if its properties match any of the provided patterns:
#     for entry in database:                      # iterate through all entries in database
#         for prop_name, ptrn in patterns.items():    # iterate through all property patterns in `patterns`
#             entry_prop_val = entry.get(prop_name)   # get the value of the entry's property matching the current pattern property name
#             # if this entry has at least one property matching the corresponding pattern,
#             # then add it to then list of matched entries:
#             if _does_pattern_match_value(ptrn, entry_prop_val):
#                 matched_entries.append(entry.copy())# append the a *copy* of the entry to the list of matches (entry copied so the original is unaffected)
#                 break                           # break this loop, and continue to check the next entry in the database

#     # 2) Sort and then return the entries:
#     matched_entries.sort(key=lambda entry: entry.get(sort_prop), reverse=not ascending)
#     return matched_entries[:n]                  # (even if n is larger than length of the list, no errors are raised)

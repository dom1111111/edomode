from pathlib import Path
import json
from operator import itemgetter

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
    # 'title': str,                                           # 'title' is the identifying property - must be unique for all entries across all types
    'time': int,                                            # 'time' will be a timestamp (seconds since the Epoch) for creation time
    'type': ("note", "page", "task")                        # 'type' can be one the values in this tuple
}


#####################################
######### Support Functions #########
#####################################

### Database File Read/Write ###

def _read_database(lib_path:Path) -> dict[str, dict]:
    db_path = lib_path / _FILE_PATHS['database']            # create path to database file
    with open(db_path, 'r') as f:
        return json.load(f)                                 # read the db JSON file - return list of the db

def _write_database(lib_path:Path, db_data:dict):
    db_path = lib_path / _FILE_PATHS['database']            # create path to database file
    with open(db_path, 'w') as f:
        json.dump(db_data, f, indent=3)                     # write the the entries data back to the db file

### Library Setup/Validation ###

def _validate_library(lib_dir:str) -> Path:
    """Ensure that the provided library path string (lib_dir) is an existing directory 
    and has all needed sub-dirs/files for a library. Then return `Path` object of the string."""
    lib_path = Path(lib_dir)
    assert lib_path.is_dir(),f"{lib_dir} is not an existing directory"  # make sure that the provided directory already exists
    # Create all of the data dirs/files if they don't already exist in the library:
    data_dir = lib_path / _DATA_DIR
    if not data_dir.exists():                               # make sure `.data` dir exists
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
                    json.dump(initial_data, f, indent=1)    # if this is the path is for the database file, then create a JSON file with an initial entry log
                elif p.suffix == ".json":
                    json.dump({}, f, indent=1)              # if the path specifies a JSON file, create JSON with an empty dictionary (object)
                else:
                    f.write()                               # otherwise just create an empty file
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
        if isinstance(correct_val, type):                   # if the model value is a 'type', then make sure the entry-data's value is of that same type
            assert isinstance(entry_prop_val, correct_val), wrong_type_err_msg
        else:                                               # otherwise (model value is a sequence of values), make sure entry-data's value is in the sequence of values
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
    sections surrounded by quotes. Also removes any duplicate tokens and makes them all
    lowercase.
    - ex: `hello world and "goodbye world"` will be returned as:
    `["hello", "world", "and", "goodbye world"]`
    - `hello big"blue"world` will return as `["hello", "big", "blue", "world"]`
    """
    tokens = set()
    tok = ''
    for char in pattern:                                    # iterate through all characters in the pattern string
        quoted = tok.startswith('"')                        # determine if current token is quoted or not
        if (char.isspace() and not quoted) or (char == '"' and quoted):
            # Proceed if the current character is a whitespace (including \n, etc.) and the current token 
            # is not quoted - OR - if the current character is a quote and the current token is quoted 
            # (means this is the end of the quoted section).
            if tok:                                         # only add current token if it's not empty
                if quoted:
                    tok = tok.strip('"')                    # if the token is quoted, remove any starting or trailing quote characters, but nothing else
                tokens.add(tok.lower())                     # append the current token to the list of tokens, converting all of its characters to lowercase (does nothing if token already exists - so there can't be any duplicates)
                tok = ''                                    # reset the current token to be an empty string
        else:
            tok += char                                     # if the character isn't whitespace or the end of a quote, add it to current token
    if tok:
        tokens.add(tok.lower())                             # finally check if there's any remaining tokens, and add them tokens list
    return list(tokens)                                     # convert tokens set to list, and then return

def _get_pattern_value_matches(pattern:str, value:str|int|float) -> int:
    """Get the number of times a value matches a pattern.

    The search pattern syntax is relatively simple and follows these rules:
    - for strings, character case doesn't matter (everything becomes lowercase for consistency)
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
    - prepending a token with `#` will denote a special pattern can be used to match values 
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
    ptrn_tokens = _tokenize(pattern)
    ptrn_matches = 0                                        # the number of times the value contained/matched a token in the pattern
    if isinstance(value, str):
        value = value.lower()                               # if the value is a string, make sure its entirely lowercase
    for tok in ptrn_tokens:
        # Exclusion Prefix:
        if tok.startswith('!') and tok[1:] in value:
            return 0                                        # if the the pattern token starts with the exclusion prefix, and the value contains this token, return 0 (value contains pattern which must NOT be present)
        # Inclusion Prefix:
        elif tok.startswith('*'):                           # if the the pattern token starts with the inclusion prefix, 
            if tok[1:] in value:
                ptrn_matches += 1                           # and the value contains this token, then increment the number of pattern matches
            else:
                return 0                                    # otherwise if the value does not contain this token, return 0 (value doesn't contain pattern which MUST be present)
        # Number Prefix:
        elif tok.startswith('#'):
            if not isinstance(value, (int, float)):
                continue                                    # if the pattern specifies value to match number(s), and the value is not a number (int or float type), then continue to next token (value is incorrect type)
            n_ptrn = tok[1:]                                # remove the `#` prefix from pattern token to isolate the number matching syntax
            # if `-` is in pattern, treat it as number range check:
            if '-' in n_ptrn:
                try:                                        # convert each number character in pattern to list of floats
                    n = (float(x) for x in n_ptrn.split('-'))
                except:
                    continue                                # if conversion fails, continue to next token (wrong syntax was used)
                if value > n[0] and value < n[1]:
                    ptrn_matches += 1                       # if the value is within the range specified by the pattern, increment the number of pattern matches
            # if the pattern contains `>` or `<`, then treat it as a great-than/less-than check:
            elif ('>' in n_ptrn) or ('<' in n_ptrn):
                n = n_ptrn[1]                               # isolate the number to check value against
                try:
                    n = float(n)                            # convert number to float
                except:
                    continue                                # if conversion fails, continue to next token (wrong syntax was used)
                if '>' in n_ptrn and value > n:
                    ptrn_matches += 1                       # if `>`, increment the number of pattern matches if value is greater-than the number to check against
                elif '<' in n_ptrn and value < n:
                    ptrn_matches += 1                       # if `<`, increment the number of pattern matches if value is less-than the number to check against
            # otherwise, if just a single number:
            else:
                try:
                    n = float(n)                            # convert number to float
                except:
                    continue                                # if conversion fails, continue to next token (wrong syntax was used)
                if value == n:
                    ptrn_matches += 1                       # increment the number of pattern matches if the value is equal to the number
        # No Prefix (or `/`):
        else:
            if tok.startswith('/'):
                tok = tok[1:]                               # remove any starting slashes from token
            if tok in value:
                ptrn_matches += 1                           # simply, if the token is in the value, increment the number of pattern matches
    
    return ptrn_matches                                     # finally, return the number of pattern matches

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
    lib_path = _validate_library(lib_dir)                   # ensure library directory is set up properly
    _validate_entry_data(entry_data)                        # ensure that the entry has valid properties
    # 1) Read the database and ensure that the title doesn't already exist:
    entries = _read_database(lib_path)                      # read database file and get entries dict
    assert not title in entries.keys(), f'Cannot create new entry with the title "{title}". An entry already has this title.'
    # 2) Add the entry to the database:
    entries.update({title: entry_data})
    _write_database(lib_path, entries)                      # write the modified dict back to database file

def update_entry(lib_dir:str, title:str, new_title:str=None, entry_data:dict={}):
    """Overwrite an existing entry in a library database.
    - `title`: the current title of the entry to edit
    - `new_title`: (if provided) title to replace the existing title 
    - `entry_data`: (if provided) a dictionary with the property names and values which will 
    overwrite the existing ones. If a property isn't included here, then the existing 
    property value will be left as is."""
    # 0) Validate the library directory and read database:
    lib_path = _validate_library(lib_dir)                   # ensure library directory is set up properly
    entries = _read_database(lib_path)                      # read database file and get entries dict
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
    _validate_entry_data(new_data)                          # ensure that the updated entry has valid properties
    # 3) Finally add updated entry back to the database:
    entries.update({title: new_data})
    _write_database(lib_path, entries)                      # write the modified dict back to database file
    
def delete_entry(lib_dir:str, title:str):
    """Delete the entry whose title is `title`. If entry doesn't exist, does nothing"""
    lib_path = _validate_library(lib_dir)                   # ensure library directory is set up properly
    entries = _read_database(lib_path)                      # read database file and get entries dict
    entries.pop(title, None)                                # remove the entry with `title` from the db dict
    _write_database(lib_path, entries)                      # write the modified dict back to database file

### Read Functions ###

def get_all_entries(lib_dir:str):
    """Get all of the entries in a library."""
    lib_path = _validate_library(lib_dir)                   # ensure library directory is set up properly
    return _convert_entries_to_list(_read_database(lib_path))   # get entries dict from reading database file, convert to list, and return

def get_n_recent_entries(lib_dir:str, n:int):
    """Get a maximum of `n` most recent entries in a library."""
    lib_path = _validate_library(lib_dir)                   # ensure library directory is set up properly
    entries = _read_database(lib_path)                      # read database file and get entries dict
    entries_list = _convert_entries_to_list(entries)        # convert the entries dictionary to a list 
    if len(entries_list) <= n:
        return entries_list                                 # if the total number of entries is less than `n`, just return all of them
    return entries_list[-n:]                                # otherwise return the last `n` entries

def get_entries_by_title(lib_dir:str, titles:list[str]):
    """Get all entries whose title's match those in the `titles` list arg."""
    lib_path = _validate_library(lib_dir)                   # ensure library directory is set up properly
    entries = _read_database(lib_path)                      # read database file and return entries dict
    title_entries = []
    for title in titles:
        entry = entries.get(title)                          # get each entry value dict with the matching title key
        if entry:                                           # if the entry exists with that title, append it the title_entries list, adding the title as a property
            title_entries.append(dict({'title':title}, **entry))
    return title_entries

def get_entries_by_patterns(lib_dir:str, patterns:dict=None, sort_props:list=[('title', 'ASC')], n:int=None) -> list[dict]:
    """Get a dictionary containing all entries within a library (`lib_dir`) whose properties 
    match a search pattern string. Can also sort those entries by one or more properties, with
    individual direction for each.

    ### Arguments:
    - `lib_dir` - The path to the library to get entries from.
    - `patterns` - A dictionary where the keys are entry property names, and the values are pattern strings for the property values to match.
        - If not provided (None), then all entries will be matched and only the sorting mechanic will be applied.
        - For a description of the of how match patterns work, see the docstring for the `_does_pattern_match_value()` function in this same module.
    - `sort_props` - A list of tuples, where each tuple has an entry property name to use for sorting, and a string to specify sorting direction.
        - Sorting direction strings can be either: "ASC" for ascending, or "DSC" for descending. 
        - Multiple tuples can be within this list, where the first tuple is the most significant sorting rule, and the last is the least significant.
        - Additionally, if the property name is "MATCHSCORE" (instead of an actual entry property), then the match scores of the entries will be used to sort them.
            - Match scores are (roughly) the number of times a pattern was matched within the entry. Higher match score generally means a stronger match.
        - If no list is provided, the default is `["title", "ASC"]` -> meaning the entries will be sorted by title, in ascending order.    
    - `n` - The maximum number of sorted entries to return.

    ### Examples:
    - If you wanted to find the 50 most recent entries whose titles contain "hello", and with
    titles in alphabetical order if time is the same, you could use: 
        - `patterns = {'title': "hello"}, sort_props = [('time', asc)], n = 50`
    """
    # 0) Load Database:
    lib_path = _validate_library(lib_dir)                   # ensure library directory is set up properly, and set it up if not
    entries = _convert_entries_to_list(_read_database(lib_path))    # read the db file, convert to list of all entries
    matched_entries = []                                    # this will be the list which holds all matching entries from the database
    entry_match_scores = []                                 # this will hold all the matched entry's match scores

    # 1) Check each entry to see if its properties match any of the provided patterns:
    if patterns:
        for entry in entries:                               # iterate through all entries in database
            match_score = 0
            for prop_name, ptrn in patterns.items():        # iterate through all property patterns in `patterns`
                entry_prop_val = entry.get(prop_name)       # get the value of the entry's property matching the current pattern property name
                if not entry_prop_val:
                    continue                                # if the the entry does not have this property, then skip this cycle and continue to check the next one
                if isinstance(entry_prop_val, list):        # if the entry's property value is a list, convert it to a string first
                    entry_prop_val = ', '.join(entry_prop_val)
                match_score += _get_pattern_value_matches(ptrn, entry_prop_val) # determine match score for this pattern in the entry and add it `match_score` 
            # If this entry has at least one property matching the corresponding pattern,
            # then add it to the list of matched entries and add its match score to the match score list:
            if match_score:
                matched_entries.append(entry.copy())        # append a *copy* of the entry dict to the list of matches (so the original is unaffected)
                entry_match_scores.append(match_score)
    else:
        matched_entries = entries                           # if no patterns provided, then consider ALL entries as matched entries

    # 2) Sort and then return the entries:
    sorted_matched_entries = matched_entries.copy()         # create a copy of the matched entries to be sorted
    for prop, order in reversed(sort_props):                # sort the matched entries by each sort property (need to start with last property first for this to be in correct order)
        key_func = itemgetter(prop)                         # normally, the sorting function should just return the specified entry property (does nothing if prop name not present in entry dict)
        if prop == "MATCHSCORE":                            # otherwise if the property is "MATCHSCORE", then the sorting function should return the match score for the item (same index between lists)
            key_func = lambda entry: entry_match_scores[matched_entries.index(entry)]   # get the index of this entry in the matched_entries list, and use that index for getting its corresponding match score in entry_match_scores
        rev = True if order.upper() == 'DSC' else False 
        sorted_matched_entries.sort(key=key_func, reverse=rev)
    if n:                                                   # if `n` provided, then return at most `n` number of sorted matched entries
        return sorted_matched_entries[:n]                   # (even if n is larger than length of the list, no errors are raised)
    return sorted_matched_entries                           # otherwise just return all

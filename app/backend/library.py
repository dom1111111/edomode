from pathlib import Path
import json
import frontmatter

########################
######### Data #########
########################
 
# The relative paths for each reserved base library directory and file:
_DIR_PATHS = {
    'data': Path(".data"),
    'non_entry': Path(".non_entry")
}
_FILE_PATHS = {
    # 'database': _DIR_PATHS['data'] / "database.json",
    'settings': _DIR_PATHS['data'] / "settings.json",
}

# File characters that cannot be in filenames:
_ILLEGAL_FILE_CHARS = '<>:"/\|?*'

# The properties which ALL entries MUST have:
_BASE_PROPERTIES = {
    'title': str,                                           # 'title' is the identifying property - must be unique for all entries across all types
    'time': int,                                            # 'time' will be a timestamp (seconds since the Epoch) for creation time
    'type': ("note", "page", "task"),                       # 'type' can be one the values in this tuple
    'content': str                                          # 'content' is the actual content of an entry
}


#####################################
######### Support Functions #########
#####################################

### Library Setup/Validation ###

def validate_library(lib_dir:str) -> Path:
    """Ensure that the provided library path string (lib_dir) is an existing directory 
    and has all needed sub-dirs/files for a library. Then return `Path` object of the string."""
    # 1) Make sure that the provided path string leads to an existing directory:
    lib_path = Path(lib_dir)
    assert lib_path.is_dir(),f"{lib_dir} is not an existing directory"  # make sure that the provided directory already exists
    # 2) Make sure that each special directory exists in the library dir:
    for dir in _DIR_PATHS:
        full_path = lib_path / dir
        full_path.mkdir(exist_ok=True)                      # create any directories which don't already exist
    for file in _FILE_PATHS:
        full_path = lib_path / file
        if not full_path.exists():                          # only continue if the file path doesn't exist
            with open(full_path, 'w') as f:
                if full_path.suffix == ".json":
                    json.dump({}, f, indent=1)              # if the path specifies a JSON file, create JSON with an empty dictionary (object)
                else:
                    f.write()                               # otherwise just create an empty file
    # 3) Return Path object of library dir string:
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

### Entry Filepath Generation ###

def _get_entry_filepath(lib_dir:str, title:str) -> Path:
    """Get a complete path (Path object) for a library entry markdown file, where
    the file name matches the title. Any characters in the title string which are 
    illegal in file names, will be converted to their Unicode "code-point" surrounded 
    by `%` symbols."""
    safe_file_name = ""
    for char in title:
        if (not char.isascii()) or (char in (_ILLEGAL_FILE_CHARS + '%')):
            char = f"%{ord(char)}%"
        safe_file_name += char
    return Path(lib_dir) / (safe_file_name + ".md") 

def _get_entry_title_from_filepath(filepath:str) -> str:
    """Get an entry title from its file name, un-encoding any file safe character 
    representations back to their original characters"""
    title = ""
    current_code = ""
    for char in Path(filepath).stem:                        # iterate through each character of the file path name (without suffix)
        if char == '%':
        # if the char is '%' and there's no current code, then append this char to current code (this is start of a code):
            if not current_code:
                current_code += char
        # if the char is '%' and there is a current code, then convert the current code to its original character (this is end of a code):
            else:
                original_char = chr(int(current_code.strip('%')))   # remove the '%' symbols, convert digits back to int, and convert int back to unicode character
                title += original_char                              # add this original character to overall decoded title string
                current_code = ""                                   # reset current_code to be blank
        # if the char is anything but a '%' and there is a current code, then add char to current code:
        elif current_code:
            current_code += char
        # otherwise if the character isn't a '%' and there's no current code, then add this char to overall decoded title string:
        else:
            title += char
    return title

### Support For Search Operations ###

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


######################################################
######### Main Functions for Library Entries #########
######################################################

### Write Functions  - Create, Edit, Delete ###

def create_entry(lib_dir:str, entry_data:dict):
    """Create a new entry in a library. `entry_data` must be dictionary which 
    includes all of the properties and their values that the entry should have 
    (these must include the base properties)."""
    # 0) Validate and prepare the entry data:
    _validate_entry_data(entry_data)                        # ensure that the entry has valid properties 
    title = entry_data.pop('title')                         # remove and get the title and content from entry_data
    content = entry_data.pop('content')
    # 1) Create and validate a file path for the entry:
    entry_filepath = _get_entry_filepath(lib_dir, title)    # generate a file path (markdown file) for the entry from its title
    assert not entry_filepath.exists(), f'Cannot create new entry with the title "{title}". An entry already has this title.'
    # 2) Create a new file for the entry, including its properties as YAML front-matter:
    frontmatter.dump(frontmatter.Post(content, **entry_data), entry_filepath)

def update_entry(lib_dir:str, title:str, new_entry_data:dict):
    """Overwrite an existing entry in a library.
    - `title`: the current title of the entry to edit.
    - `new_entry_data`: a dictionary with the property names and values which will 
    overwrite the existing ones. If a property isn't included here, then the existing 
    property value will be left as is. If a "title" property is included here, then it 
    will replace the current title for the entry."""
    # 1) Get the existing entry data and update it with the new data:
    entry_data = get_entry_by_title(lib_dir, title)         # get the existing entry
    entry_data.update(new_entry_data)                       # update the existing entry with the new entry data
    # 2) Validate and prepare the updated entry data:
    _validate_entry_data(entry_data)                        # ensure that the updated entry has valid properties 
    new_title = entry_data.pop('title')                     # remove and get the title and content from the updated entry_data
    content = entry_data.pop('content')
    entry_filepath = _get_entry_filepath(lib_dir, new_title)    # generate a file path (markdown file) for the entry from its title
    # 3) If a new title was provided, then validate it and delete the old entry file:
    if title != new_title:
        assert not entry_filepath.exists(), f'Cannot update entry with the title "{new_title}". An entry already has this title.'
        delete_entry(lib_dir, title)                        # delete the old file (only if the new title isn't already in use)
    # 4) Rewrite the file (or write a new file) for the entry, including its properties as YAML front-matter:
    frontmatter.dump(frontmatter.Post(content, **entry_data), entry_filepath)

def delete_entry(lib_dir:str, title:str):
    """Delete the entry whose title is `title`. If entry doesn't exist, does nothing"""
    entry_filepath = _get_entry_filepath(lib_dir, title)    # generate a file path (markdown file) for the entry from its title
    if entry_filepath.exists():
        entry_filepath.unlink()                             # delete the entry file if it exists

### Read Functions ###

def get_entry_by_title(lib_dir:str, title:str) -> dict:
    """Get a single entry with the title `title`."""
    entry_filepath = _get_entry_filepath(lib_dir, title)    # generate a file path (markdown file) for the entry from its title
    assert entry_filepath.exists(), f"""Cannot get the entry with title "{title}". It doesn't exist in database"""
    post = frontmatter.load(entry_filepath)                 # read the entry file 
    return dict({'title':title, 'content':post.content}, **post.metadata)
        # ^ and return an entry dict containing all properties, including title and content

def get_entries_by_title(lib_dir:str, titles:list[str]) -> list[dict]:
    """Get all entries whose title's match those in the `titles` list arg."""
    entries = []
    for title in titles:                                    # iterate through each title in the list,
        entries.append(get_entry_by_title(lib_dir, title))  # and append an entry dict matching each title to the list of entries
    return entries

def get_entries_by_patterns(lib_dir:str, patterns:dict=None, sort_props:list=[('title', 'ASC')], n:int=None) -> list[dict]:
    """Get a list containing all entries within a library (`lib_dir`) whose properties match a search pattern string. 
    Can also sort those entries by one or more properties, with individual direction for each.

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
        - `patterns = {'title': "hello"}, sort_props = [('time', 'DSC')], n = 50`
    """
    matched_entries = []                                    # this will be the list which holds all matching entries from the database
    entry_match_scores = []                                 # this will hold all the matched entry's match scores
    
    # 1) Read all entry files and convert to list of entry dicts:
    all_entries = []
    for path in Path.iterdir(lib_dir):                      # iterate through each path in the top level of the library directory
        if path.is_file() and (path.suffix == ".md"):       # if the path is a markdown file, then it can be considered an entry
            post = frontmatter.load(path)                   # read the entry file,
            title = _get_entry_title_from_filepath(path)    # get the title from file path
            all_entries.append(dict({'title':title, 'content':post.content}, **post.metadata))
                # ^ and append an entry dict containing all properties, including title and content, to the list of all entries 

    # 2) Check each entry to see if its properties match any of the provided patterns:
    if patterns:                                            # only continue if patterns were provided
        for entry in all_entries:                           # iterate through all entries in database
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
                matched_entries.append(entry)               # append the entry dict to the list of matches
                entry_match_scores.append(match_score)
    else:
        matched_entries = all_entries                       # if no patterns provided, then consider ALL entries as matched entries

    # 3) Sort and then return the entries:
    sorted_matched_entries = matched_entries.copy()         # create a copy of the matched entries to be sorted
    for prop, order in reversed(sort_props):                # sort the matched entries by each sort property (need to start with last property first for this to be in correct order)
        def key_func(entry):
            # This sorting key function will return the specified entry sort property value to use for sorting.
            # But if the sort property is not present in the entry, then it will instead return a value which
            # is compatible its type and unobtrusive in affecting the sort order.
            prop_type = _BASE_PROPERTIES.get(prop)          # get the property type from _BASE_PROPERTIES directly
            if isinstance(prop_type, (tuple, list)):        
                prop_type = prop_type[type(0)]              # or its a tuple/list of values, from the type of its first element
            default_vals_by_type = {                        # adjust values so that this is always the *last* entry
                int: float('-inf') if order.upper() == "DSC" else float('inf'),
                str: '' if order.upper() == "DSC" else ('z'*100)
            }
            def_val = default_vals_by_type.get(prop_type)   # get the default value based on property type
            return entry.get(prop, def_val)
        if prop == "MATCHSCORE":                            # otherwise if the property is "MATCHSCORE", then the sorting function should return the match score for the item (same index between lists)
            key_func = lambda entry: entry_match_scores[matched_entries.index(entry)]   # get the index of this entry in the matched_entries list, and use that index for getting its corresponding match score in entry_match_scores
        rev = True if order.upper() == 'DSC' else False 
        sorted_matched_entries.sort(key=key_func, reverse=rev)
    if n:                                                   # if `n` provided, then return at most `n` number of sorted matched entries
        return sorted_matched_entries[:n]                   # (even if n is larger than length of the list, no errors are raised)
    return sorted_matched_entries                           # otherwise just return all


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

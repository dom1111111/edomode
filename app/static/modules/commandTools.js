
///////// Command Class /////////

/**
 * A class to manage commands.
 * 
 * Contains methods for converting string input into the suitable data to select and execute a command
 * with both positional and named arguments.
 * 
 * ## About Command Input:
 * 
 * Each command string must have all parameters separated by whitespace, unless surrounded by quotes.
 * The first parameter will be the command name. Anything after will be positional arguments, and anything 
 * with the `--` prefix will be considered a named argument. Any parameters after a named argument (but before 
 * another named argument or the end of the string) will be part of the value for that argument. If there are 
 * multiple values here, then they will be consolidated as an array or string value for the named argument, 
 * depending its specified value type. Additionally, any excess positional arguments may be consolidated into 
 * a single value for the last positional argument, if a string or array type is specified for it.
 * 
 * Unlike a typical CLI, ALL command parameters are both positional and named, but some are optional while some
 * are required. As soon as the first named argument is entered, then everything after must belong to named 
 * arguments, and nothing further can be entered as positional.
 * 
 * Because of this, each command must be in this order:
 *   1. command name
 *   2. positional arguments which have single values, separated by whitespace (quoted if space is needed)
 *   3. any positional argument with multiple values (array / string) (quotes not needed)
 *   4. named arguments and their values, separated by names with `--` prefix
 * 
 */
class CommandManager {
    /**
     * Add an object of commands, validate them, and create further objects to index the commands.
     * 
     * @param {Object} commands - The object containing an object for each command. Each one must
     * have the correct structure.
     */
    constructor(commands) {
        this.commands = this.validateCommands(commands);    // validate each command, ensuring it has correct structure
        this.comAliasMap;
        this.comPreCheckMap;
    }

    /// Command Checking/Validation Methods ///

    /**
     * Validate an object with commands.
     * 
     * @param {Object} commands - the object containing all commands.
     * @returns {Object} - the same command object, but after validation.
     */
    validateCommands(commands) {
        // do stuff here to check if commands are valid
        if (!commands || commands.constructor !== Object ) {
            throw new TypeError("`commands` must be an Object");                    
        }
        // then iterate through each command in commands and ensure they have the right keys, etc.
        // also if iterations ends immediately, throw error saying that "the `commands` Object cannot be empty"
        return commands;
    }

    /** Make sure that a given name exists within the `commands` object.
     * 
     * @param {string} name - the name of the command to check.
     */
    validateComName(name) {
        if (!this.commands.hasOwnProperty(name)) {          // if the class `commands` object does not have a command under `name`, then raise an error
            throw new Error(`There is no available command with the name "${name}"`);
        }
    }

    /**
     * Get a boolean as to whether an argument matches the specified acceptable value for that argument.
     * 
     * @param {string|number|boolean|Array} arg - the argument to check for validity.
     * @param {string|Array} check - the thing which specifies what acceptable value the argument can be.
     */
    isArgValid(arg, check) {
        if (
            (Array.isArray(check) && check.includes(arg)) ||    // if the check value is an array, then the arg value must be present in the array
            (check === "STR" && typeof arg === "string") ||     // if check is "STR", arg must be a string
            (check === "NUM" && typeof arg === "number") ||     // if check is "NUM", arg must be a number
            (check === "ARY" && Array.isArray(arg)) ||          // if check is "ARY", arg must be an array
            (check === true && arg === true)                    // if check is `true`, arg must be `true`
        ) { return true; }                                      // if any of the above conditions are met, return true
        return false;                                           // otherwise return false
    }

    /// Command Parameter Parsing Methods ///

    /** 
     * Convert a string into an array of tokens, split at whitespace and quoted passages.
     * 
     * @param {string} str - the string to parsed into tokens.
     * @returns {Array.<string>} - an array with each string token.
     */
    parseStrToTokens(str) {
        var tokens = [];                                    // stores each string token
        var currentToken = "";                              // stores the current token that a character should go in
        var quoted = false;                                 // whether or not the character is within a quoted passage
        // Iterate through each character in the string:
        for (const char of str) {
            if (!char.trim() && !quoted) {                  // if the current character is whitespace (`trim()` leaves an empty string if only whitespace) and not part of a quoted passage in the string
                if (currentToken) {                         // and if the current token isn't empty,
                    tokens.push(currentToken);              // then add the token to the array of tokens
                    currentToken = "";                      // and reset the current token to be empty again.
                }
            } else if (char === '"') {                      // if the current character is a quote `"`,
                if (quoted) {                               // and if the current token is quoted, then this quote character signifies the END of a quoted passage in the string,
                    tokens.push(currentToken);              // and so add the token to the array of tokens
                    currentToken = "";                      // and reset the current token to be empty again    
                    quoted = false;                         // and reset quoted to be false.
                } else {                                    // otherwise if the current token is NOT quoted, then this quote character signifies the START of a quoted passage,
                    quoted = true;                          // and so quoted should be set to true.
                }
            } else {                                        // if the character is not a whitespace OR a whitespace in a quoted passage of the string,
                currentToken += char                        // then just append the character to the current string.
            }
        }
        if (currentToken) {                                 // if there is still a current token left,
            tokens.push(currentToken);                      // then add it to the array of tokens.
        }
        // Return the array of string tokens:
        return tokens;
    }

    /**
     * Parse an array of string tokens into command properties following general rules.
     * 
     * These are the rules:
     * - The first token will be treated as the command name.
     * - All tokens after the first, but prior to a named argument, will be treated as positional 
     * arguments.
     * - Any tokens starting with a double dash `--` will be treated as named arguments, and any 
     * subsequent tokens (which don't have double dashes themselves) will be considered as values for 
     * those named arguments.
     *     - If a named argument token has no subsequent values (so either immediately followed by 
     * other named argument tokens or it's the last token in the array), then it will be considered as a 
     * boolean flag and be given the value `true`.
     *     - If the same named argument is present more than once in the tokens, then all value tokens 
     * in each occurrence will be considered for that named argument. (except if they still have no value 
     * tokens, then it will just become a boolean as usual).
     * - Also, any argument value which can be converted into a number, will be. 
     * 
     * @param {Array.<string>} tokens - an array of string tokens.
     * @returns {Object} - an object containing "name": command name string, "pargs": positional arguments array, and "nargs": named arguments object.
     */
    parseTokensToProps(tokens) {
        let name = tokens[0];                               // get the command name from the first token
        let pargs = [];
        let currentNarg;
        let nargs = {};
        
        for (var tok of tokens.slice(1)) {                  // iterate through the token array starting after the first token
            if (!tok.startsWith('--')) {                    // if the token doesn't start with `--`,
                if (Number(tok)) {
                    tok = Number(tok);                      // then first, if the string token can become a number, make it a number
                }
                if (!currentNarg) {                         // and if there hasn't been any named arguments yet
                    pargs.push(tok);                        // then append this token to the positional argument array
                } else {                                    // but if there HAS been a named argument, then this token should be one of its values
                    if (!Array.isArray(nargs[currentNarg])) {   // first check if this is the first value (if so, then named-arg value will NOT be an array)
                        nargs[currentNarg] = [];            // and make its value an array if needed
                    }
                    nargs[currentNarg].push(tok);           // then add this token to the named argument value array 
                }
            } else {                                        // if the token DOES start with `--`,
                let nargName = tok.replace('--', '');       // then firstly remove the starting `--` from it,
                currentNarg = nargName;                     // set the current named argument to be this token
                if (!nargs[currentNarg]) {
                    nargs[currentNarg] = true;              // if it doesn't already exist, create a new key/value for this in the named args object, with a `true` value
                }
            }
        }

        return {name: name, pargs: pargs, nargs: nargs}     // finally return the object with command name, positional arguments, and named arguments
    }

    /**
     * Convert general arguments into specific arguments for executing a command. Accepts a command 
     * name, positional arguments, and named arguments, and will return a single array of validated 
     * arguments needed for that command, and in the correct order (as command functions only accept
     * positional arguments).
     * 
     * The parsing will follow these rules:
     * - If the parameter corresponding to the last positional argument specifies an array 
     * or string value, then this last argument and any excess positional arguments will be joined 
     * into a single array or string value, respectively. Otherwise, any excess positional arguments 
     * will be discarded. 
     * - Similarly, if a named argument has several values, and the parameter specifies an array or 
     * string value, then all values for the named argument will be used, but if not, then only the 
     * *first* argument value will be used. 
     * - If there is both a positional argument and named argument which apply to the same parameter,
     * then the named argument's value will be used.
     * 
     * @param {string} name - the name of the command.
     * @param {Array} pargs - the positional arguments for the command.
     * @param {Object} nargs - the named arguments for the command.
     * @returns {Array} - an array of all of the arguments in order, ready to be used for command execution.
     */
    getUsableCommandArgs(name, pargs, nargs) {
        this.validateComName(name);                         // ensure that the command name exists within the `command` object
        let args = [];                                      // the array to store all arguments
        const comParams = this.commands[name].inputParams;  // get the input parameters of the command named `name`
        if (!comParams || comParams.length < 1) {
            return args;                                    // if the command has no input parameters, then immediately return the (empty) args
        }
        let lastPargIdx;                                    // stores the index of the last used positional argument
        
        // Iterate through each command parameter, getting its index and then name, specified possible values, and default value (if any):
        for (const [i, [pName, pVal, defVal]] of comParams.entries()) {
            let a;                                          // The argument to potentially be added to array of arguments.
            if (nargs.hasOwnProperty(pName)) {              // If there is a named argument with same name as this parameter,
                a = nargs[pName];                           // then set the arg to have the named argument's value.
                if (Array.isArray(a)) {                     // but also if the argument is an array, 
                    if (pVal === "STR") {                   // and the parameter value specifies a string,
                        a = a.join(' ');                    // then join the argument array into a single string.
                    } else if (!pVal === "ARY") {           // otherwise if the parameter value does NOT specify a string or an array,
                        a = a[0];                           // then change argument value to be only the first element in its array.
                    }
                }
            } else if (pargs.hasOwnProperty(i)) {           // Or if there's a value present in the positional argument array at the same index as the command parameter array,
                a = pargs[i];                               // then set arg to have the positional argument's value.
                lastPargIdx = i;                            // then update the last-positional-argument-index value to be this index.
            } else {                                        // If there is neither a named or positional argument for this parameter,
                if (defVal !== undefined) {                 // but there *is* a default value, then use the default value,
                    a = defVal;
                } else {                                    // but if there's no default value (so an argument is REQUIRED), then throw an error
                    throw new Error(`No argument was provided for the required "${pName}" parameter of the "${name}" command`)                         
                }
            }
            args[i] = a;                                    // then finally add the argument to the argument array at the correct index
        }

        // Determine if there are extra positional arguments which should be combined and used as an argument value:
        const lastPargParamVal = comParams[lastPargIdx][1]  // get the specified value for the command parameter at the same index as the last used positional argument
        if (pargs.length > lastPargIdx + 1) {               // if the last positional argument used was NOT the last element in the array of positional arguments,
            if (lastPargParamVal === "ARY") {               // and if the corresponding parameter specifies an array ("ARY"),
                args[lastPargIdx] = pargs.slice(lastPargIdx);           // then combine all the remaining positional arguments into a single array and set that as the argument value.
            } else if (lastPargParamVal === "STR") {        // but if the corresponding parameter specifies a string ("STR"),
                args[lastPargIdx] = pargs.slice(lastPargIdx).join(' '); // then combine all the remaining positional arguments into a single string and set that as the argument value.
            }
        }

        // Check that each argument is valid
        for (const [i, [pName, pVal, defVal]] of comParams.entries()) {
            let a = args[i];
            if (!isArgValid(a, pVal)) {                      // if the argument is not valid (it matches the parameter's specified value), then throw an error
                throw new Error(`"${a}" is an invalid argument for the "${pName}" input parameter of the "${name}" command`)                         
            }
        }

        return args                                         // finally, return an object containing the command name and arguments
    }

    /// Main Command Methods ///

    /**
     * Execute a command from a given name and arguments.
     * 
     * @param {string} name - The name of the command to execute.
     * @param {Array} args - The arguments to pass to the command.
     * @returns {any} - the result of the command.
     */
    executeCommand(name, args) {
        this.validateComName(name);                         // ensure that the command name exists within the `command` object
        const func = this.commands[name].action             // get the command's action function
        return func(...args);                               // call the action function with the arguments, returning the result
    }

    /**
     * Execute a command from a given input string. Will gather command name 
     * and arguments from the string, and then call the command's action 
     * function from those.
     * 
     * @param {string} inputStr - the string to be parsed into command parameters.
     */
    inputToCommandAction(inputStr) {
        const tokens = this.parseStrToTokens(inputStr);                 // convert text to tokens
        const {name, pargs, nargs} = this.parseTokensToProps(tokens);   // convert tokens to command parameters
        const args = this.getUsableCommandArgs(name, pargs, nargs);     // get usable arguments from positional and named arguments
        return this.executeCommand(name, args);                         // execute the command, returning the result (if any)
    }

}


///////// Exports /////////

export { CommandManager };

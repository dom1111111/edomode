///////// Elements /////////

const mainView = document.getElementById("main-viewer");
const logView = document.getElementById("log-view");
const commandBar = document.getElementById("command-bar");


/////////////////////////////////////////////////////////////////////////////////

///////// Data /////////

const serverURL = window.location.origin;                   // gets the url origin (protocol, hostname, and port) of the server URL (to be used to make further requests)

///////// Support Functions /////////

/** Convert epoch timestamp to readable date-time string */
function timestampToStr(timestamp) {
    // timestamp should be int
    const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const timeObj = new Date(timestamp);
    const hour = timeObj.getHours()
    const time = {
        year:   timeObj.getFullYear(),
        month:  (timeObj.getMonth() + 1).toString().padStart(2, '0'),
        day:    timeObj.getDate().toString().padStart(2, '0'),
        weekday:weekdays[timeObj.getDay() - 1],
        hour:   hour.toString().padStart(2, '0'),
        minute: timeObj.getMinutes().toString().padStart(2, '0'),
        second: timeObj.getSeconds().toString().padStart(2, '0'),
        tHour: (hour > 12) ? (hour - 12) : hour,
        period: (hour > 12) ? 'pm' : 'am' 
    }
    return `${time.weekday} ${time.year}-${time.month}-${time.day} ${time.tHour}:${time.minute}:${time.second} ${time.period}`;
}

/** Convert readable datetime string to epoch timestamp */
function strToTimestamp(readableStr) {
    
}

/** Make JSON request to server, get a JSON response */
async function serverRequest(endPoint, objectData) {
    try {
        const response = await fetch(serverURL + endPoint, {
            method: "POST",                                 // makes a POST method (rather than GET)
            mode: "cors",
            headers: {
                "Content-Type": "application/json"          // lets server know that this is JSON
            },
            body: JSON.stringify(objectData)                // `JSON.stringify` converts object into JSON string
        });
        var result = await response.json();                 // this will become an object
    } catch (error) {
        console.log("Error:", error);
    };
    return result
}


/////////////////////////////////////////////////////////////////////////////////

///////// Commands /////////

const commandsOLD = {

    /** Get all entries from the server and render them */
    async displayAllEntries() {
        response = await serverRequest("/lib/all", {});     // make request to server, sending the data
        for (const entryTitle in response) {                // iterate through response, getting title and data for each entry
            let entryData = response[entryTitle];
            logView.addEntry(entryTitle, entryData['time'], null, entryData['content']);    // render the entry in the log-view
        }
    },

    /** Create, store, and render a new entry */
    async createEntry(content) {
        let now_time = Date.now();
        let time_str = timestampToStr(now_time)
        let data = {                                        // create the object with data of the new log entry's properties, and the library it belongs to
            title: `Log ${time_str}`,
            entry_data: {
                time: now_time,
                type: "log",
                // supers: "",
                content: content
            }
        };
        serverRequest("/lib/new", data);                    // send the entry to server for storage
        logView.addEntry(data.title, time_str, "", data.entry_data.content);    // render new entry in log-view
    }
};

const commands = {

    example: {
        desc: "This is an example command. It accepts 2 arguments: a single string, and one of three numbers: 1, 2, or 3.", // the description of the command
        aliases: ["do_example", "example_go"],              // alternative names that the command can be identified by (should always be in snake case (spaces represented by underscores `_`))
        preCheck() {                                        // an example of a pre-check - a function that (if provided) will be called before the input parameters are checked
            return true                                     // function will always be tested for truthiness. If the return value of the pre-check is truthy, then the command will be considered "available" for execution
        },
        inputParams: [                                      // an array of the input parameters that the command accepts (must match the order of action function's parameters)
            ['string_1', "STR"],                            // each element must be an array, whose first value is the parameter name, the second denotes the acceptable value for its argument, and (optional) the third may be its default value, denoting if the parameter is optional or not
            ['string_2', ["a", "b", "c"]],                  // the acceptable values can either be a string denoting type ("STR" for string, "NUM" for numbers, "ARY" for array, or `true`), or an array of possible values that the argument could be
            ['number', [1, 2, 3], 2],                       // if a command parameter has a default value, it will mean the argument for it is optional
            ['flag', true, false]                           // also, if the acceptable value (2nd element) is `true`, then a matching named argument just has to be present in the input (will default to false if not present), so they act like flags
        ],
        action(str1, str2, num=2, flag=false) {             // the main action for the command - a function that is called when the command is executed. *Does not need a return value* (will be ignored if included)
            console.log("this is your first string:", str1);
            console.log("this is your second string:", str2);
            console.log("this is your number:", num);
            if (flag) {
                console.log("the flag is present");
            }
        }
        // Notes:
        //  - if a command definition object doesn't need a property, then it should be excluded rather than left blank.
        //      - ex: if a command has no aliases, then the `aliases` property of the command object should not be included.
    },

    time: {
        desc: "Get the current date and time.",
        aliases: ["get_time"],
        action() {
            time_str; //= datetime.now().strftime("%Y-%b-%d %I:%M:%S %p")
            console.log("The current date and time is: " + time_str)
        }
    },

    timer: {
        desc: `Set a timer.
 - "quantity": a number to specify the quantity of time to set the timer for.
 - "unit": the unit of time (seconds, minutes, hours) that the quantity should apply to.
 - "message" (optional): a message to deliver at the timer's completion.`,
        aliases: ["set_timer"],
        inputParams: [
            ['quantity', ["s", "m", "h", "second", "minute", "hour", "seconds", "minutes", "hours"]],
            ['unit', 'NUM'],
            ['message', 'STR', '']
        ],
        action(quantity, unit, msg='') {
            // console.log(quantity, unit);
            // console.log(msg);
        }
    },

    calculate: {
        desc: "Do some math. Type in an expression as numbers together with operator symbols, each separated by whitespace, and get the result. Will follow typical order of operations",
        inputParams: [
            ['ops', "ARY"]
        ],
        action(...ops) {
            exp = "";
            operators = ['+', '-', '*', '/', '(', ')'];
            for (const op of ops) {
                // go through each, trying to convert each op (operator/operand) to number,
                // otherwise check that symbol is a math operator, and leave it alone. discard if neither!
                // 
                exp += op;                                  // add the op to the expression string
            }
            result = eval(exp);                             // evaluate the expression string
            console.log(result);
        }
    },

    sum: {
        desc: "Add numbers together and get the result. The numbers should be separated by whitespace, and may have a minus `-` prefix.",
        inputParams: [
            ['numbers', "ARY"]
        ],
        action(...nums) {
            // for each, convert into numbers, discarding anything which isn't a number
            // OR raising error.

            let sum;
            // sum (see if there's a sum function)

            console.log(sum);
        }
    }
}

///////// Command Class /////////

class CommandManager {
    constructor(commands) {
        // validate command
        this.commands = validateCommands(commands);
        this.comAliasMap;
        this.comPreCheckMap;
    }

    /// Command Checking/Validation Methods ///

    /**
     * ...
     * 
     * @param {Object} commands - the object containing all commands.
     * @returns {Object} - the same command object, but after validation.
     */
    validateCommands(commands) {
        // do stuff here to check if commands are valid
        return commands
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
    parsePropsToArgs(name, pargs, nargs) {
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

    


}

///////// Command Executer /////////

/** 
 * Execute a command. Accepts a string argument, which will parsed into command
 * parameters, and then used to execute a command function.
 * 
 * @param {string} inputStr - the string which will be parsed into command parameters
 */
function executeCommand(inputStr) {
    let tokens = commandBar.parseStrToTokens(inputStr);         // convert text to tokens
    let {name, pargs, nargs} = commandBar.parseTokensToParams(tokens); // convert token to command parameters
    let func = commands[name];

    if (!func) {return}                                         // return immediately if no command name is found
    
    // convert pargs and nargs to purely positional args
    // // perhaps by having an index number attached to each one!
    let args = [];

    func(...args);

    // create an input/command log?
    // --> right side of the log (like messenger)
    console.log('---------');
    console.log(inputStr + '\n')
    console.log(comPrams);
}

/////////////////////////////////////////////////////////////////////////////////

///////// Setup for Actions /////////

// /** 
//  * Execute UI actions.
//  * 
//  * @param {string} action - the name of the action function to call.
//  * @param {Array} args - an array of all of the positional arguments to pass to the function (must be in order).
//  */
// function doAction(action, args) {
//     func = actions[action];
//     if (func) {
//         func(...args);                                          // only call function if a function was actually taken from actions object
//     }
//     // create log event for the action??
// }

// // SSE Setup - This is done so that the server can trigger actions here in the front-end UI
// const actionStream = new EventSource(serverURL + "/stream-ui-msgs");

// actionStream.onmessage = (event) => {
//     // FIGURE OUT WHAT EVENT.DATA IS AND HOW TO EXTRACT VALUES YOU WANT
//     // event.data
//     // console.log(event.data);
//     // console.log("action:", )

//     let name;
//     let args;
//     doAction(name, args); 
// }


/////////////////////////////////////////////////////////////////////////////////

///////// Listeners /////////



///////// Page Setup /////////

window.onload = () => {
    // displayAllEntries();                                        // render all existing entries (stored on server) in the log view
    // commandBar.action = ???                                  // set `` as the callback function for the command bar input event
    
    // TEMPORARY - for testing only:
    // commandBar.action = (inputStr) => {
    //     console.log('---------');
    //     console.log(inputStr + '\n')
    //     let tokens = commandBar.parseStrToTokens(inputStr);    // convert text to tokens
    //     let comPrams = commandBar.parseTokensToParams(tokens); // tokens to command parameters
    //     console.log(comPrams);
    // }
};

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
        inputParams: [                                      // the input parameters that the command accepts (must match the order of action function's parameters)
            "STR",                                          // Each element must either be a single string denoting a type ("STR" for string, "NUM" for numbers, "ARY" for array), 
            ["a", "b", "c"],                                // or an array of possible values that its argument could be.
            {'number': [1, 2, 3]},                          // Also, optional named parameters can be represented by an object with a single key/value, where the key is the parameter name, and the value is the type/possible values for it. The function parameter it corresponds to MUST have a default value (as named arguments are optional and can be excluded)
            {'flag':true}                                   // Additionally, named parameters can have a single boolean `true` value, in which case a matching named argument just has to be present in the input (will default to false if not present)
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
        desc: "Set a timer.\n - `quantity`: a number (int or float) to specify the quantity of time to se the timer for.\n - `unit`: the unit of time (seconds, minutes, hours) that the quantity should apply to. If not provided, the default value is 'minutes'.",
        aliases: ["set_timer"],
        inputParams: [
            ["s", "m", "h", "second", "minute", "hour", "seconds", "minutes", "hours"],
            'NUM'
        ],
        action(quantity, unit='m') {
            console.log(quantity, unit);
            console.log(this.desc);
        }
    },

    calculate: {
        desc: "Do some math. Type in an expression as numbers together with operator symbols, each separated by whitespace, and get the result. Will follow typical order of operations",
        inputParams: [
            "ARY",
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
            "ARY",
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
        // commands must be object
        this.comMap = commands;
        this.comAliasMap;
        this.comPreCheckMap;
    }


    /// Support Methods ///

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

    /** 
     * Convert a string into an array of tokens, split at whitespace and quoted passages.
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
     * Parse an array of string tokens into command properties (command name and arguments). 
     * 
     * The parser will follow these rules:
     * - The first token will be treated as the command name. The properties of the matching command 
     * may be used to inform how the rest of the tokens are treated.
     * - All tokens after the first, but prior to a named argument, will be treated as positional 
     * arguments.
     *     - If the number of positional argument tokens exceeds the number of specified positional parameters 
     * for the command (of the same name), then the excess tokens will be discarded. But, if the command's 
     * last positional parameter is specified as an array, then the last and excess tokens will be joined 
     * into an array.
     *     - Also, if the command only specifies a single positional parameter which is an array, then all
     * positional argument tokens will be joined into a single array.
     * - Any tokens starting with a double dash `--` will be treated as named arguments, and any 
     * subsequent tokens (which don't have double dashes themselves) will be considered as values for 
     * those named arguments.
     *     - If a named argument token has no subsequent values (so either immediately followed by 
     * other named argument tokens or it's the last token in the array), then it will be considered as a 
     * boolean flag and be given the value `true`.
     *     - If the same named argument is present more than once in the tokens, then all value tokens in each
     * occurrence will be considered for that named argument. (except if they still have no value tokens, then it will just become a boolean as usual).
     *     - If the corresponding named parameter specifies an array value, then all values for the named argument
     * will be used, but if not, then only the *first* argument value will be used. 
     * @param {Array.<string>} tokens - an array of string tokens.
     * @returns {Object} - an object organizing the tokens into command properties.
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
                } else {
                    nargs[currentNarg].push(tok);           // but if there HAS been a named argument, then add this token to the array attached to the named argument key in the object for named args
                }
                } else {                                    // if the token DOES start with `--`,
                    let nargName = tok.replace('--', '');   // then firstly remove the starting `--` from it,
                    currentNarg = nargName;                 // set the current named argument to be this token
                    if (!nargs[currentNarg]) {
                        nargs[currentNarg] = [];            // if it doesn't already exist, create a new key/value for this in the named args object 
                    }
                }
        }
        
        // Convert positional and named arguments to only positional 
        // arguments corresponding to the command input parameters:
        let args = [];                                      // the array to store all arguments
        const comParams = this.comMap[name].inputParams;    // get the input parameters of the command named `name`
        if (!comParams || comParams.lenth < 1) {
            return {name: args};                            // if the command has no input parameters, then immediately return the name and (empty) args
        }
        const isObject = (p) => p.constructor === Object;   // a small arrow function to test if something is an Object
        var namParamsIdx = comParams.findIndex(isObject);   // get the index of the first element in input parameters array which is a named parameter (an Object)
        if (namParamsIdx === -1) {
            namParamsIdx = comParams.length;                // if there are no named params (`-1` returned from `findIndex()`), then change the named parameter index to be the length of the array
        }
        for (let i = 0; i < namParamsIdx; i++) {            // first iterate through only the positional arguments (index from 0 to first named arg index (which is end of array if none))
            const pVal = comParams[i];                      // get the specified value of the parameter
            let arg = pargs[i];                             // get the value of the positional argument at some position (index) as the parameter's position
            if (!arg) {                                     // if the positional argument at this index is not present (meaning there are less arguments than parameters required!)
                // raise error, return error message, OR
                // ADD ERROR IN LOG (or *command bar error message*) saying:
                // `One or more positional arguments not provided for the "{name}" command`
                // -> can create try/catch mechanic for command executor!
            }
            if (i === namParamsIdx - 1 && pVal === "ARY") { // if this is the last of the positional parameters, and it specifies an array argument ("ARY"),
                arg = pargs.slice(posParams.length - 1);    // then combine all the remaining positional arg tokens into an single array and set that as the argument value
            }
            if (isArgValid(arg, pVal)) {
                args.push(arg)
            } else {
                // ADD ERROR IN LOG (or *command bar error message*) saying:
                // `One or more positional arguments are invalid for the "{name}" command`
            }
        }
        for (let i = namParamsIdx; i < comParams.length; i++) { // then iterate through only the named arguments (index from first named arg index to end of the array)
            // if no named parameters are present from input, then this entire block will be skipped
            const p = comParams[i];                         // get the parameter
            const [pName, pVal] = Object.entries(p)[0];     // get the name and specified value of the parameter
            let arg = nargs[pName];                         // get the value of the named argument matching the parameter name
            if (arg) {
                if (arg.length < 1) {                       // if the argument array value is empty,
                    arg = true                              // then change the value to be `true` instead of an empty array
                } else if (!pVal === "ARY") {               // otherwise if the argument array does have items, but the parameter value does NOT specify an array
                    arg = arg[0]                            // then change its value to be only the first element in its array
                }
                if (isArgValid(arg, pVal)) {
                    args.push(arg)
                } else {
                    // ADD ERROR IN LOG (or *command bar error message*) saying:
                    // `The value of the named argument "pName" is invalid for the "{name}" command`
                }
            } else {
                args.push(undefined);                       // if the named argument is not present, then just make its value in the overall positional arguments be `undefined`
            }
        }

        return {name: args,}                                // finally, return an object containing the command name and arguments
    }
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

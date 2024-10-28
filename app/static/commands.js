import * as mainResources from "./script.js";

/////////////////////////////////////////////////////////////////////////////////

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
}

///////////////////////////

const INCOMPLETEdefaultCommands = {

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
            if (quantity <= 0) {
                console.log(`"${quantity}" is an invalid quantity. Must be a number greater than zero.`)
                return
            }

            // __OLD PYTHON CODE TO MODIFY__
            // unit = unit if unit in get_args(time_units) else 's'        # make sure that unit is within time_units Literal, otherwise set it to 's' (seconds)
            // unit_val = unit[0]                                          # convert any unit string to consistent value by getting only the first letter of the string
            // name_multi = {                                              # matches time unit-value to a readable name and a multiplier to convert it to seconds
            //     's': ("second", 1),
            //     'm': ("minute", 60),
            //     'h': ("hour", 3600)
            // }
            // unit_name, mutli = name_multi.get(unit_val)                 # get the readable name and seconds-multiplier from the unit-value
            // unit_name = unit_name if quantity < 1 else unit_name + 's'  # make readable name plural if needed -> add "s" to end of name if quantity is greater than 1
            // sec_time = (quantity * mutli)                               # get the exact time in seconds for the timer by multiplying the quantity by the unit's seconds-multiplier
            // print(f"Timer set for {quantity} {unit_name} from now")
            // print(sec_time)
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

/////////////////////////////////////////////////////////////////////////////////

///////// Commands /////////

const defaultCommands = {

    example: {
        desc: "This is an example command. It accepts 2 arguments: a single string, and one of three numbers: 1, 2, or 3.", // the description of the command
        aliases: ["do_example", "example_go"],              // alternative names that the command can be identified by (should always be in snake case (spaces represented by underscores `_`))
        preCheck() {                                        // an example of a pre-check - a function that (if provided) will be called before the input parameters are checked
            return true                                     // function will always be tested for truthiness. If the return value of the pre-check is truthy, then the command will be considered "available" for execution
        },
        inputParams: [                                      // an array of the input parameters that the command accepts (must match the order of action function's parameters)
            ['string_1', "STR"],                            // each element must be an array, whose first value is the parameter name, the second denotes the acceptable value for its argument, and (optional) the third may be its default value, denoting if the parameter is optional or not
            ['string_2', ["a", "b", "c"]],                  // the acceptable values can either be a string denoting type ("STR" for string, "NUM" for numbers, "BOO" for boolean, "ARY" for array), or an array of possible values that the argument could be
            ['number', [1, 2, 3], 2],                       // if a command parameter has a default value, it will mean the argument for it is optional
            ['flag', 'BOO', false]                          // also, if the acceptable value (2nd element) is "BOO" and default value (3rd element) is `false`, then a matching named argument will behave like a flag, and just has to be present in the input without any other following values (will be given `true` value if present)
        ],
        action(str1, str2, num=2, flag=false) {             // the main action for the command - a function that is called when the command is executed. *Does not need a return value* (will be ignored if included)
            let message = "This is an example command action.\n" + 
            "- this is your first string: " + str1 + '\n' +
            "- this is your second string: " + str2 + '\n' +
            "- this is your number: " + num;
            if (flag) {
                message += "\n- and the flag is present";
            }
            mainResources.logView.addEntry({title: "Example Command Output", content: message});
        }
        // Notes:
        //  - if a command definition object doesn't need a property, then it should be excluded rather than left blank.
        //      - ex: if a command has no aliases, then the `aliases` property of the command object should not be included.
    },

    time: {
        desc: "Get the current date and time.",
        aliases: ["get_time"],
        action() {
            const time_str = mainResources.timestampToStr(Date.now());
            mainResources.logView.addEntry({content: "The current date and time is: " + time_str});
        }
    }
}

///////// Exports /////////

export {defaultCommands};
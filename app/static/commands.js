import * as MAIN from "./script.js";

/////////////////////////////////////////////////////////////////////////////////

const INCOMPLETECommands = {

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
        desc: "This is an example command.",                // the description of the command
        aliases: ["do_example", "example_go"],              // alternative names that the command can be identified by (should always be in snake case (spaces represented by underscores `_`))
        preCheck() {                                        // an example of a pre-check - a function that (if provided) will be called before the input parameters are checked
            return true                                     // function will always be tested for truthiness. If the return value of the pre-check is truthy, then the command will be considered "available" for execution
        },
        inputParams: [                                      // an array of the input parameters that the command accepts (must match the order of action function's parameters)
            ['string_1', ["a", "b", "c"]],                  // each element must be an array, whose first value is the parameter name, the second denotes the acceptable value for its argument, and (optional) the third may be its default value, denoting if the parameter is optional or not
            ['string_2', "STR"],                            // the acceptable values can either be a string denoting type ("STR" for string, "NUM" for numbers, "BOO" for boolean, "ARY" for array), or an array of possible values that the argument could be
            ['number', [1, 2, 3], 2],                       // if a command parameter has a default value, it will mean the argument for it is optional
            ['flag', "BOO", false]                          // also, if the acceptable value (2nd element) is "BOO" and default value (3rd element) is `false`, then a matching named argument will behave like a flag, and just has to be present in the input without any other following values (will be given `true` value if present)
        ],
        action(str1, str2, num=2, flag=false) {             // the main action for the command - a function that is called when the command is executed. *Does not need a return value* (will be ignored if included)
            let msg = "Example Command Output\n\n" +
            "This is an example command action.\n" + 
            "- this is your first string: " + str1 + '\n' +
            "- this is your second string: " + str2 + '\n' +
            "- this is your number: " + num;
            if (flag) {
                msg += "\n- and the flag is present";
            }
            MAIN.displayLogMessage(msg, `"example" command`);
        }
        // Notes:
        //  - if a command definition object doesn't need a property, then it should be excluded rather than left blank.
        //      - ex: if a command has no aliases, then the `aliases` property of the command object should not be included.
    },

    "test-command-error": {
        action() {
            let x = oof;
            MAIN.displayLogMessage(x);
        }
    },

    "test-server-error": {
        async action() {
            response = await MAIN.serverRequest("/error-test", {});
            MAIN.displayLogMessage(response);
        }
    },

    time: {
        desc: "Get the current local time.",
        inputParams: [
            ['exact', "BOO", false]                         // optional parameter, will add seconds to time if included
        ],
        action(exact=false) {
            // Create new Date object from a time stamp of the current time:
            const time = new Date(Date.now());
            // Get hours, converting to 12-h time
            let hours = time.getHours();
            let period = 'a.m.';
            if (hours > 12) {
                period = "p.m.";
                hours -= 12;
            } else if (hours === 0) {
                hours = 12;
            }
            // Create the time string, adding seconds if `exact` is true, and padding mins and secs with 0 if only 1 digit long:
            let timeStr = String(hours) + ":" + String(time.getMinutes()).padStart(2, "0");
            if (exact) {
                timeStr += ":" + String(time.getSeconds()).padStart(2, "0");
            }
            timeStr += " " + period;
            // Output the time:
            MAIN.displayLogMessage(timeStr, "The current time"); // `"time" command`
        }
    },

    date: {
        desc: "Get the current local date.",
        action() {
            // Create new Date object from a time stamp of the current time:
            const time = new Date(Date.now());
            // Create the date string:
            const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            let weekday = weekdays[time.getDay() - 1];
            // if (weekday === "Wednesday") {
            //     weekday = "It is Wednesday my dudes";
            // }
            const year = time.getFullYear();
            const month = months[time.getMonth()];
            const day = time.getDate();
            const dateStr =  `${weekday}, ${year} ${month} ${day}`;
            // Output the date:
            MAIN.displayLogMessage(dateStr, "The current date")
        }
    },

    recent: {
        desc: "Display the `n` most recent entries in the log-view",
        inputParams: [
            ['n', "NUM", 50],                               // (optional) the number of recent entries to get
        ],
        async action(n=50) {
            const data = {'n': n}                           // setting 50 as default number of entries to get   
            const response = await MAIN.serverRequest("/lib/recent", data); // make request to server, sending the data
            // the returned response should be an object with each of the entries
            MAIN.logView.clearAll()                         // first clear all currently displayed entries in the log-view
            for (const entry of response) {                 // iterate through response, getting each entry
                entry.time = MAIN.timestampToStr(entry.time);   // adjust the entry object's 'time' property to be a readable string before displaying
                MAIN.logView.addEntry(entry, "note");       // render the entry in the log-view
            }
        }
    },

    search: {
        desc: "Search for entries in the library using a single general query, and display the results in the log-view, sorted from most to least recent.",
        inputParams: [
            ['query', "STR"]                                // the search query to find entries
        ],
        async action(query) {
            const data = {'patterns': {'title': query, 'tags':query, 'content': query}};
                // the request data should contain a single "patterns" object, with property names and search patterns for them
                // in this case, the query is applied to all main string based properties: title, tags, content
            const response = await MAIN.serverRequest("/lib/search", data);     // make request to server, sending the data (the returned response should be an object with each of the entries)
            MAIN.displayLogMessage("", `Results for Search Query: "${query}"`); // first create a message to denote the start of the search results
            for (const entry of response) {                 // iterate through response, getting each entry
                entry.time = MAIN.timestampToStr(entry.time);   // adjust the entry object's 'time' property to be a readable string before displaying
                MAIN.logView.addEntry(entry, "pastEntry");  // render the entry in the log-view, displayed as separate from regular entries
            }
        } 
    },

    "search-props": {
        desc: "Search for entries in the library with specified entry properties, and display the results in the log-view, sorted from most to least recent.",
        inputParams: [
            ['title', "STR", ""],                           // (optional) the search pattern for the "title" property
            ['tags', "STR", ""],                            // (optional) the search pattern for the "tags" property
            // ['time', "STR", ""],                            // (optional) the search pattern for the "time" property
            ['content', "STR", ""]                          // (optional) the search pattern for the "content" property
        ],
        async action(title, tags, content) {
            const data = {'patterns':{}};                   // the request data should contain a single "patterns" object, with each supplied property name and value
            const patterns = [['title', title], ['tags', tags], ['content', content]];
            let queryMsg = ``                               // a string to represent the properties and their patterns
            for (const [name, val] of patterns) {
                if (val) {
                    data.patterns[name] = val;              // add the property name and value, but ONLY if the value was actually supplied
                    queryMsg += `${name}: "${val}", `       // add name and val to query message
                }
            }
            if (queryMsg.endsWith(', ')) {queryMsg = queryMsg.slice(0, -2)}         // remove any un-needed trailing chars from query message
            MAIN.displayLogMessage("", `Results for Search Query: {${queryMsg}}`);  // first display a message to denote the start of the search results
            if (!Object.keys(data.patterns).length > 0) {
                return                                      // if no patterns were given at all, then return now
            }
            const response = await MAIN.serverRequest("/lib/search", data);     // make request to server, sending the data (the returned response should be an object with each of the entries)
            for (const entry of response) {                 // iterate through response, getting each entry
                entry.time = MAIN.timestampToStr(entry.time);   // adjust the entry object's 'time' property to be a readable string before displaying
                MAIN.logView.addEntry(entry, "pastEntry");  // render the entry in the log-view, displayed as separate from regular entries
            }
        } 
    },

    note: {
        desc: "Create a new note entry, and display it in the log-view.",
        inputParams: [
            ['content', "STR"],                             // the main content (this is always required)
            ['title', "STR", ""],                           // (optional) note title
            ['tags', "ARY", []]                             // (optional) note tags
        ],
        async action(content, title="", tags=[]) {
            let time;
            if (title.length < 1) {
                time = Date.now();
                title = `Note ${time}`                      // if title not provided, then set title to be "Note" + the current time stamp
            }
            if (tags.length < 1) {
                tags = undefined;                           // if tags are not provided, make sure they are entirely not included (undefined)
            }
            await MAIN.createNoteEntry(title, content, time, tags);
        }
    },
    
}

///////// Exports /////////

export {defaultCommands};
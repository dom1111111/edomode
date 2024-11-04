import "./components/base.js";
import "./components/views.js";
import {CommandManager} from "./modules/command-tools.js";
import {defaultCommands} from "./commands.js";

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

/// --------- ///

/**
 * Make a JSON POST request to the back-end server, get a JSON response.
 * 
 * This also will throw an Error if the server should return a 
 * response object which has a single "ERROR" key, and will expect
 * the corresponding value to be a string for the error message.
 * 
 * This will NOT catch any errors from this process, and is expected to 
 * be used in an external context where errors will be be handled.
 * 
 * @param {string} endPoint - the relative path of the server endpoint to make the request at.
 * @param {Object} data - an object containing the data for the POST request body.
 * @returns 
 */
async function serverRequest(endPoint, data) {
    const response = await fetch(serverURL + endPoint, {
        method: "POST",                                 // makes a POST method (rather than GET)
        mode: "cors",
        headers: {
            "Content-Type": "application/json"          // lets server know that this is JSON
        },
        body: JSON.stringify(data)                      // `JSON.stringify` converts object into JSON string
    });
    var result = await response.json();                 // this will become an object
    // Handle any errors returned by the server:
    // if the response is an object with only a single "ERROR" key, throw a "server" error:
    if (result.constructor === Object && Object.keys(result).toString() === "ERROR") {
        const svrErrMsg = "An error occurred on the server: \n" + result["ERROR"]   // get the error message from the value of the result "ERROR" object
        const serverError = new Error(svrErrMsg)        // create a new error object, and set its message
        serverError.name = "ServerError";               // set the name for the error
        throw serverError;                              // throw the error
    }
    return result;
}

/** 
 * The primary function for handling errors for contexts in which the user
 * should be most aware of them (executing commands mostly). 
 * Render a log entry for the error, and print it in the console.
 * 
 * @param {Error} e - The Error object to display from.
 */
function displayError(e) {
    createLogEntry(e.message, e.name, "error")
    console.error(e);
}


/////////////////////////////////////////////////////////////////////////////////

///////// Internal Actions /////////

/**
 * Create a new log event entry. Will store the entry in the backend and render it in the log view.
 * 
 * @param {string} content - a message to explain the entry event.
 * @param {number} time - (optional) an epoch/unix timestamp of when the event occurred. Defaults to the current time when called. 
 * @param {string} command - (optional) the name of the command (or thing) which produced the entry event. Defaults to an empty string.
 * @param {string} type - (optional) the type of log entry. Can only be one of these values: "message", "input", "error". Defaults to "message"
 */
function createLogEntry(content, title="", type="message", time=Date.now()) {
    // 1) Make sure the arg values are valid:
    const typeVals = ["message", "input", "error"];         // the possible values for the 'type' property
    if (!typeVals.includes(type)) {                         // ensure that 'type' value is valid
        throw new Error(
            `"${type}" is an invalid value for a log entry 'type' property.` +  
            `Must be one of the following: ${typeVals.join(' ')}`
        );
    }
    // 2) Send server request to create and store a new log entry:
    const data = {                                          // create a new object containing each of the properties of a log event entry
        'type': type,
        'title': title,
        'time': time,
        'content': content,
    }
    // await serverRequest("/lib/new", data);                  // send request to server to create and store a new entry with the entry properties
                                                            // -> this must be complete and without errors before continuing
    // 3) Render the new entry in the log view:
    logView.addEntry(type, title, timestampToStr(time), content)  // render new entry in log-view
}



/////////////////////////////////////////////////////////////////////////////////

///////// Command Manager /////////

const com = new CommandManager(defaultCommands);            // Create new `CommandManager` object, passing in the command object 


///////// Command Executer /////////

/** 
 * Execute a command from input. Accepts a string, which will lead
 * to the execution of a command action function.
 * 
 * @param {string} inputStr - the string which will be used to select and execute a command.
 */
async function executeCommandFromInput(inputStr) {
    let name;
    let args;
    // 1) Extract the command name and arguments from the input string:
    try {
        [name, args] = com.getCommandParamsFromInput(inputStr);     // extract the command name and arguments from the input string
        createLogEntry(inputStr, `Input matched to "${name}" command`, "input");    // display the input event
        await com.executeCommand(name, args);                       // execute the command. -> must use `await` in order to catch errors from any async command functions
    } catch (error) {
        if (name) {                                                 // if error and `name` is defined, modify error to include command name
            error.message = `${error.name}: ${error.message}`
            error.name = `"${name}" command execution error`;
        }
        displayError(error);                                        // display error (create entry, print in console)
    }
}


/////////////////////////////////////////////////////////////////////////////////

///////// Listeners /////////



///////// Page Setup /////////

window.onload = () => {
    // displayAllEntries();                                    // render all existing entries (stored on server) in the log view
    commandBar.action = executeCommandFromInput;            // set `executeCommandFromInput` as the callback function for the command bar input event
};

///////// Exports (used by `commands` module) /////////

export {logView, timestampToStr, serverRequest, createLogEntry}
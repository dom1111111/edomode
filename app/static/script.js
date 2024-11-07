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
async function serverRequest(endPoint, data={}) {
    if (data.constructor !== Object) {
        throw new TypeError("The 'data' argument must be an Object");
    }
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
    if (result && result.constructor === Object && Object.keys(result).toString() === "ERROR") {
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
    displayLogMessage(e.message, e.name, "error");
    console.error(e);
}


/////////////////////////////////////////////////////////////////////////////////

///////// Internal Actions /////////

function displayLogMessage(content, title="", styleType="message") {
    const props = {                                         // create a new object with log message properties
        'title': title,
        'time': timestampToStr(Date.now()),                 // add in time string
        'content': content
    }
    logView.addEntry(props, styleType);                     // display the message entry in log-view
}

/** Get `n` most recent entries from the server and render them */
async function displayRecentEntries() {
    const data = {'n': 50}                                      // setting 50 as default number of entries to get   
    const response = await serverRequest("/lib/recent", data);  // make request to server, sending the data
    // the returned response should be an object with each of the entries
    for (const entry of response) {                             // iterate through response, getting each entry
        entry.time = timestampToStr(entry.time)                 // adjust the entry object's 'time' property to be a readable string before displaying
        logView.addEntry(entry, "note");                        // render the entry in the log-view
    }
}

/**
 * Create a new note entry, store it in the backend, and display it in the log view.
 * 
 * @param {string} title - A general title of the note.
 * @param {string} content - The main note content.
 * @param {number} time - (optional) An epoch/unix timestamp of when the note was created occurred. Defaults to the current time when called. 
 * @param {Array} tags - (optional) An array of tags which the note is categorized by.
 */
async function createNoteEntry(title, content, time=Date.now(), tags) {
    // 1) Create the note properties object:
    const props = {                                         // create a new object with note entry properties
        'title': title,
        'time': time,
        'type': "note",                                     // make sure to add the 'type' property with "note" value (this is needed for entry storage)
        'content': content
    }
    if (tags) {
        props['tags'] = tags;                               // adds 'tags' property only if it was included in args
    }
    // 2) Store the note on the server:
    await serverRequest("/lib/new", props);                 // send request to server to create and store a new note entry with the entry properties
        // -> this must be complete and without errors before continuing
    // 3) Display the entry in the log-view:    
    props['time'] = timestampToStr(time);                   // convert time property to string representation before displaying
    logView.addEntry(props, "note");                        // display the new entry in log-view
}

/////////////////////////////////////////////////////////////////////////////////

///////// Command Manager /////////

const com = new CommandManager(defaultCommands);            // Create new `CommandManager` object, passing in the command object 


///////// Command Executer /////////

/** 
 * Execute a command from input. Accepts a string, which will lead
 * to the execution of a command action function. 
 * 
 * By default, this operates as an input for taking notes, but allows other commands
 * to be executed with the correct prefix.
 * - Any input starting with a forward slash '/', will be parsed as a normal command.
 * Otherwise, the input will be apply to the "note" command, which creates a new note.
 * 
 * @param {string} inputStr - the string which will be used to select and execute a command.
 */
async function executeCommandFromInput(inputStr) {
    let name;
    let args;
    const defaultCommand = "note"                                   // the name of the default command
    // 1) Extract the command name and arguments from the input string:
    try {
        if (inputStr.startsWith('/')) {
            inputStr = inputStr.substring(1);                       // if the input string starts with a '/', then treat it as a normal command, and remove the '/'
        } else {
            inputStr = defaultCommand + " " + inputStr              // otherwise, treat all input content as the arguments for the default command, and add the default command name to the front of string
        }
        [name, args] = com.getCommandParamsFromInput(inputStr);     // extract the command name and arguments from the input string
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
    displayRecentEntries();                                 // render most recent existing entries (stored on server) in the log view
    commandBar.action = executeCommandFromInput;            // set `executeCommandFromInput` as the callback function for the command bar input event
};

///////// Exports (used by `commands` module) /////////

export {logView, timestampToStr, serverRequest, createNoteEntry, displayLogMessage}
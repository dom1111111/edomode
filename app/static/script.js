import "./components/base.js";
import "./components/views.js";
import {CommandManager} from "./modules/command-tools.js";
import {defaultCommands} from "./commands.js";

/////////////////////////////////////////////////////////////////////////////////

///////// Elements, Objects, Data /////////

const mainView = document.getElementById("main-viewer");
const logView = document.getElementById("log-view");
const commandBar = document.getElementById("command-bar");

const serverURL = window.location.origin;                   // gets the url origin (protocol, hostname, and port) of the server URL (to be used to make further requests)

const com = new CommandManager(defaultCommands);            // Create new `CommandManager` object, passing in the command object 


/////////////////////////////////////////////////////////////////////////////////
// Functions

///////// Support /////////

/** Convert epoch timestamp to readable date-time string */
function timestampToStr(timestamp) {
    // timestamp should be int
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const timeObj = new Date(timestamp);
    const hour = timeObj.getHours()
    const time = {
        year:   timeObj.getFullYear(),
        month:  (timeObj.getMonth() + 1).toString().padStart(2, '0'),
        day:    timeObj.getDate().toString().padStart(2, '0'),
        weekday:weekdays.at(timeObj.getDay()),
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

///////// Server Request /////////

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
    // Make the server request:
    const response = await fetch(serverURL + endPoint, {
        method: "POST",                                     // makes a POST method (rather than GET)
        mode: "cors",
        headers: {
            "Content-Type": "application/json"              // lets server know that this is JSON
        },
        body: JSON.stringify(data)                          // `JSON.stringify` converts object into JSON string
    });
    // Handle any errors returned by the server:
    if (!response.ok) {
        const serverError = new Error(`${response.status} - ${response.statusText}\n${response.url}`);  // create a new error object, and set its message
        serverError.name = "Server Error";                  // set the name for the error
        throw serverError;                                  // throw the error
    }
    return await response.json();                           // parse response body as JSON, and return it (this will become an object)
}

///////// UI Display /////////

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

/**
 * Display a message in the Log View.
 * 
 * @param {string} content - the main content of the message
 * @param {string} title - (optional) the title of the message
 * @param {string} styleType - (optional) the display style the message will have (can be "message", or "error")
 */
function displayLogMessage(content, title="", styleType="message") {
    const props = {                                         // create a new object with log message properties
        'title': title,
        'time': timestampToStr(Date.now()),                 // add in time string
        'content': content
    }
    logView.addEntry(props, styleType);                     // display the message entry in log-view
}

///////// Entry Writing /////////

/**
 * Create a new library entry, store it in the backend, and display it in the log view.
 * 
 * @param {Object} props - An object containing all the entry properties. Will be checked to ensure it has all mandatory base properties.
 */
async function createEntry(props) {
    // 1) Ensure the properties object has all mandatory base entry properties:
    for (const p_name of ['title', 'time', 'type', 'content']) {
        if (!props.hasOwnProperty(p_name)) {
            throw new Error(`Cannot create entry which is missing the "${p_name}" base property`)
        }
    }
    // 2) Store the note on the server:
    await serverRequest("/lib/new", props);                 // send request to server to create and store a new note entry with the entry properties
        // -> this must be complete and without errors before continuing
    // 3) Display the entry in the log-view:    
    props['time'] = timestampToStr(props['time']);          // convert time property to string representation before displaying
    logView.addEntry(props, "note");                        // display the new entry in log-view
}

///////// Command /////////

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
    const defaultCommand = "note"                           // the name of the default command
    // 1) Extract the command name and arguments from the input string:
    try {
        if (inputStr.startsWith('/')) {
            inputStr = inputStr.substring(1);               // if the input string starts with a '/', then treat it as a normal command, and remove the '/'
        } else {
            inputStr = defaultCommand + " " + inputStr      // otherwise, treat all input content as the arguments for the default command, and add the default command name to the front of string
        }
        [name, args] = com.getCommandParamsFromInput(inputStr); // extract the command name and arguments from the input string
        await com.executeCommand(name, args);               // execute the command. -> must use `await` in order to catch errors from any async command functions
    } catch (error) {
        if (name) {                                         // if error and `name` is defined, modify error to include command name
            error.message = `${error.name}:\n${error.message}`
            error.name = `"${name}" command execution error`;
        }
        displayError(error);                                // display error (create entry, print in console)
    }
}


/////////////////////////////////////////////////////////////////////////////////

///////// Listeners /////////



///////// Page Setup /////////

window.onload = () => {
    executeCommandFromInput('/recent')                      // render most recent existing entries (stored on server) in the log view
    commandBar.action = executeCommandFromInput;            // set `executeCommandFromInput` as the callback function for the command bar input event
};


/////////////////////////////////////////////////////////////////////////////////

///////// Exports (used by `commands` module) /////////

export {logView, timestampToStr, serverRequest, createEntry, displayLogMessage}
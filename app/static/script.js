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

/** 
 * Render a log entry for the error, and print it in the console.
 * @param {Error} e - The Error object pass in.
 */
function displayError(e) {
    logView.addEntry({
        title: e.name, 
        time: timestampToStr(Date.now()), 
        content: e.message, 
        type: "error"
    });
    console.error(e);
}

/**
 * Make a JSON POST request to server, get a JSON response.
 * 
 * This also will throw an Error if the server should return a 
 * response object which has a single "ERROR" key, and will expect
 * the corresponding value to be a string for the error message.
 * 
 * @param {string} endPoint - the relative path of the server endpoint to make the request at.
 * @param {Object} data - an object containing the data for the POST request body.
 * @returns 
 */
async function serverRequest(endPoint, data) {
    try {
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
    } catch (error) {
        displayError(error);                                // if any errors happen, then create a log entry for it
    };
}


/////////////////////////////////////////////////////////////////////////////////

///////// Command Manager /////////

const com = new CommandManager(defaultCommands, displayError);
    // Create new `CommandManager` object, passing in the command object 
    // and a command execution error handler function.

///////// Command Executer /////////

/** 
 * Execute a command from input. Accepts a string, which will lead
 * to the execution of a command action function.
 * 
 * @param {string} inputStr - the string which will be used to select and execute a command.
 */
function executeCommandFromInput(inputStr) {
    // maybe create an input log entry??
    try {
        com.inputToCommandAction(inputStr)                  // the entire process is handled by this CommandManager method
    } catch (error) {
        displayError(error);                                // if any errors are thrown in the process, then create an entry with the error message
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
    // displayAllEntries();                                    // render all existing entries (stored on server) in the log view
    commandBar.action = executeCommandFromInput;            // set `executeCommandFromInput` as the callback function for the command bar input event
};

///////// Exports (used by `commands` module) /////////

export {logView, timestampToStr, serverRequest}
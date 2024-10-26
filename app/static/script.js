import "./components/base.js";
import "./components/views.js";
import {CommandManager} from "./modules/commandTools.js";

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

///////// Command Manager /////////

const com = new CommandManager(defaultCommands)


///////// Command Executer /////////


function inputToCommandAction(inputStr) {

}

/** 
 * Execute a command. Accepts a string argument, which will parsed into command
 * parameters, and then used to execute a command function.
 * 
 * @param {string} inputStr - the string which will be parsed into command parameters
 */
// function executeCommand(inputStr) {
//     let tokens = commandBar.parseStrToTokens(inputStr);         // convert text to tokens
//     let {name, pargs, nargs} = commandBar.parseTokensToParams(tokens); // convert token to command parameters
//     let func = commands[name];

//     if (!func) {return}                                         // return immediately if no command name is found
    
//     // convert pargs and nargs to purely positional args
//     // // perhaps by having an index number attached to each one!
//     let args = [];

//     func(...args);

//     // create an input/command log?
//     // --> right side of the log (like messenger)
//     console.log('---------');
//     console.log(inputStr + '\n')
//     console.log(comPrams);
// }

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

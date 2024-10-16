///////// Elements /////////

const mainView = document.getElementById("main-viewer");
const logView = document.getElementById("log-view");
const commandInput = document.getElementById("command-bar");


/////////////////////////////////////////////////////////////////////////////////

///////// Data /////////

const serverURL = window.location.origin;                       // gets the url origin (protocol, hostname, and port) of the server URL (to be used to make further requests)

///////// Support Functions /////////

// Convert epoch timestamp to readable datetime string //
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

// Convert readable datetime string to epoch timestamp //
function strToTimestamp(readableStr) {
    
}

// Make JSON request to server, get a JSON response //
async function serverRequest(endPoint, objectData) {
    try {
        const response = await fetch(serverURL + endPoint, {
            method: "POST",                                     // makes a POST method (rather than GET)
            mode: "cors",
            headers: {
                "Content-Type": "application/json"              // lets server know that this is JSON
            },
            body: JSON.stringify(objectData)                    // `JSON.stringify` converts object into JSON string
        });
        var result = await response.json();                     // this will become an object
    } catch (error) {
        console.log("Error:", error);
    };
    return result
}


/////////////////////////////////////////////////////////////////////////////////

///////// UI Actions /////////

const actions = {

    // Get all entries from the server and render them //
    async displayAllEntries() {
        response = await serverRequest("/lib/all", {});         // make request to server, sending the data
        for (const entryTitle in response) {                    // iterate through response, getting title and data for each entry
            let entryData = response[entryTitle];
            logView.addEntry(entryTitle, entryData['time'], null, entryData['content']);    // render the entry in the log-view
        }
    },

    // Create, store, and render a new entry //
    async createEntry(content) {
        let now_time = Date.now();
        let time_str = timestampToStr(now_time)
        let data = {                                            // create the object with data of the new log entry's properties, and the library it belongs to
            title: `Log ${time_str}`,
            entry_data: {
                time: now_time,
                type: "log",
                // supers: "",
                content: content
            }
        };
        serverRequest("/lib/new", data);                        // send the entry to server for storage
        logView.addEntry(data.title, time_str, "", data.entry_data.content);    // render new entry in log-view
    }
};

///////// Setup for Actions /////////

/** 
 * Execute UI actions.
 * 
 * @param {string} action - the name of the action function to call.
 * @param {Array} args - an array of all of the positional arguments to pass to the function (must be in order).
 */
function doAction(action, args) {
    func = actions[action];
    if (func) {
        func(...args);                                          // only call function if a function was actually taken from actions object
    }
    // create log event for the action??
}

// SSE Setup - This is done so that the server can trigger actions here in the front-end UI
const actionStream = new EventSource(serverURL + "/stream-ui-msgs");

actionStream.onmessage = (event) => {
    // FIGURE OUT WHAT EVENT.DATA IS AND HOW TO EXTRACT VALUES YOU WANT
    // event.data
    // console.log(event.data);
    // console.log("action:", )

    let name;
    let args;
    doAction(name, args); 
}


/////////////////////////////////////////////////////////////////////////////////

///////// Command Sending /////////

/**
 * Send a command to be processed and executed.
 * 
 * @param {string} name - the name of the command.
 * @param {Array} pargs - an array of all of the positional arguments (must be in order).
 * @param {Object} nargs - an object with all of the named arguments.
 */
async function sendCommand(name, pargs = [], nargs = {}) {
    commandData = {                                             // construct the object to contain the command name and arguments
        name: name,
        args: pargs,
        kwargs: nargs,
    };
    serverRequest('/command', commandData);                     // send command data to '/command' server endpoint to be executed
    
    // __ONLY UNCOMMENT IF YOU WANT TO ESTABLISH ACTION CALLS WITHIN IMMEDIATE REQUEST-RESPONSE CYCLE__
    // response = await serverRequest('/command', commandData);
    // if (typeof response === "object") {                         // if the response is an object, then assume that the command's execution called for UI actions to happen
    //     for (const property in myObj) {
    //         let name = property;
    //         let args = myObj[key];
    //         doAction(name, args)                                // also assumes that the object contains valid action names, and an array for arguments!
    //     }
    // }
}


/////////////////////////////////////////////////////////////////////////////////

///////// Listeners /////////



///////// Page Setup /////////

window.onload = () => {
    displayAllEntries();                                        // render all existing entries (stored on server) in the log view
    commandInput.action = createEntry;                          // set `createEntry` as the callback function for the command bar input event
};

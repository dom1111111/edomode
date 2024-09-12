///////// Elements /////////

const tabBar = document.getElementById("tab-bar");
const mainView = document.getElementById("main-viewer");
const commandInput = document.getElementById("command-input");
const bigLog = document.createElement("big-log");                               // create bigLog


///////// Library Data /////////

const serverURL = window.location.origin;                                       // gets the url origin (protocol, hostname, and port) of the server URL (to be used to make further requests)
var tempLibPath = "/home/dom/Desktop/doms_files/Coding_Projects/apps/_UUI_Super_App/2024.05_SA/_test_library";


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


///////// Main Server-Based Functions /////////

// Get all entries from the server and render them //
async function getAllEntries() {
    let data = {lib_dir: tempLibPath};                          // create the object with data for the request
    response = await serverRequest("/lib/all", data);           // make request to server, sending the data
    console.log(response)
    for (const entryTitle in response) {                        // iterate through response, getting title and data for each entry
        let entryData = response[entryTitle];
        bigLog.addEntry(entryTitle, entryData['time'], null, entryData['content']); // render the entry in the big-log
    }
}

// Create, store, and render a new entry //
async function createEntry(content) {
    let now_time = Date.now();
    let time_str = timestampToStr(now_time)
    let data = {                                                // create the object with data of the new log entry's properties, and the library it belongs to
        lib_dir: tempLibPath,
        title: `Log ${time_str}`,
        entry_data: {
            time: now_time,
            type: "log",
            // supers: "",
            content: content
        }
    };
    serverRequest("/lib/new", data);                            // send the entry to server for storage
    bigLog.addEntry(data.title, time_str, "",data.entry_data.content);  // render new entry in big log
}


///////// Page Setup /////////

mainView.appendChild(bigLog);                                                   // add the bigLog widget into main-view
getAllEntries()                                                                 // render all existing entries (stored on server) in the big log


///////// Listeners /////////

commandInput.addEventListener("keyup", (e) => {
    if (e.key == 'Enter' && !(e.shiftKey) && e.target.value) {
        // ^ if the enter key was pressed, while not holding shift, and the input was not empty, then:
        createEntry(commandInput.value)                                         // create and render a new entry with command bar value as content
        commandInput.value = "";                                                // clear the input value
    }
})

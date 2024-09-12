
///////// Element Creation Functions /////////

function create_log_entry(time, title, supers, content) {
    // The HTML and CSS code for the element
    const theHTML = `

    `;
    const theCSS = `

    `;
    // 1) Create the entry element(s)
    const entry = document.createElement("div");// create a new `div` element
    entry.outerHTML
    entry.classList.add("entry");               // add the log-entry class name to its class list
    entry.innerHTML = MyElement.entryHTMLCode;  // set its HTML to be the HTML for a log-entry
    // 2) Add property values to entry          // (`innerText` is a safe way to do this)
    entry.querySelector(".time").innerText = time;          // set time value
    entry.querySelector(".title").innerText = title;        // set title value
    entry.querySelector(".supers").innerText = supers;      // set time value
    entry.querySelector(".content").innerText = content;    // set content value
    // 3) Add the entry to log element
    this.shadowRoot.appendChild(entry);         // finally, append this new entry element to this one (through its shadow root)
}

///////// Action Functions /////////
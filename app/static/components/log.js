// NOTE: see template file for how to recreate this

customElements.define("big-log", class MyElement extends HTMLElement {

    ////// CUSTOM ELEMENT HTML/CSS CODE //////

    // static logEntryClassName = "entry";

    // HTML Code:
    static HTMLCode = ``;   // overall HTML code

    static entryHTMLCode = `
    <div class="header1">
        <span class="time">time</span>
        <span class="supers">supers</span>
    </div>
    <div class="header2">
        <span class="title">Title</span>
    </div>
    <hr>
    <p class="content">content</p>
    `;                      // HTML for specific sub-elements

    // Style CSS Code:
    static styleCSS = `
    /* Overall Element Style */
    :host {                         /* ':host' css pseudo-class applies to the shadow DOM element containing this CSS */
        flex: 1;
        padding: 2px;
        display: flex;
        flex-direction: column;
        overflow-y: auto;           /* makes it so that if this grows past its parent height, it will scroll vertically */
        gap: 4px;
    }

    /* Entry Style */
    .entry {
        border: 1px solid black;
        border-radius: 3px;         /* gives the border rounded corners */
        padding: 2px;
        background-color: rgba(255, 255, 255, 0.35);
    }
    .entry .header1 {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        font-size: 0.8em;
    }
    .entry .header2 {
        display: flex;
        flex-direction: column;
        justify-content: center;
    }
    .entry .title {
        font-weight: bold;
        font-size: 1.2em;
        align-self: center;
    }
    .entry .supers {
        color: #34344A;
    }
    .entry .content {
        margin: 1rem;
    }

    /* Entry Spawn Animation */
    .entry {
        animation-duration: 0.2s;
        animation-name: slidegrow;
    }
    @keyframes slidegrow {
        0% {
            translate: -100vw 0;    /* start completely off screen from the left */
            scale: 0%;
        }
        100% {
            translate: 0 0;
            scale: 100%;
        }
    }
    `;

    ////// Setup Methods /////

    constructor() {
        super();                                    // calls the constructor of the parent/extender class (`HTMLElement`)
    }

    connectedCallback() {                           // This will be called each time the element is added to the document
        /// Setup Code: ///                         // putting the component setup code in this method (lifecycle callback) is preferred to putting it in the constructor
        this.attachShadow({ mode: "open" });        // create a shadow DOM tree for this element
        // Set the HTML:
        this.shadowRoot.innerHTML = MyElement.HTMLCode; // set the HTML code for this element through its shadow DOM
        // Set the CSS:
        const cssSheet = new CSSStyleSheet();       // setting CSS is done through the `CSSStyleSheet` interface
        cssSheet.replaceSync(MyElement.styleCSS);
        this.shadowRoot.adoptedStyleSheets = [cssSheet];// as usual, attach style sheet through the shadow DOM
    }

    ////// Element Accessible Methods //////

    addEntry(title, time, supers, content) {
        // 1) Create the entry element(s)
        const entry = document.createElement("div");// create a new `div` element
        entry.classList.add("entry");               // add the log-entry class name to its class list
        entry.innerHTML = MyElement.entryHTMLCode;  // set its HTML to be the HTML for a log-entry
        // 2) Add property values to entry          // (`innerText` is a safe way to do this)
        entry.querySelector(".title").innerText = title;        // set title value
        entry.querySelector(".time").innerText = time;          // set time value
        entry.querySelector(".supers").innerText = supers;      // set supers value
        entry.querySelector(".content").innerText = content;    // set content value
        // 3) Add the entry to log element
        this.shadowRoot.appendChild(entry);         // finally, append this new entry element to this one (through its shadow root)
        this.scroll({left: 0, top: bigLog.scrollHeight, behavior: "smooth"});   // scroll to bottom after new entry is added
    }
}
);
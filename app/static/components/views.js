/////////////////////////////////////////////////////////////////////////////////
// Log-View

customElements.define("log-view", class MyElement extends HTMLElement {
    
    /// HTML and CSS Code for this Element ///

    static elementHTML = ``;
    static elementCSS = `
        :host {
            flex: 1;
            padding: 2px;
            display: flex;
            flex-direction: column;
            overflow-y: auto;           /* makes it so that if this grows past its parent height, it will scroll vertically */
            gap: 4px;
        }
    `;
    
    /// Setup/Lifecycle Methods ///

    constructor() {
        super();
    }

    connectedCallback() {
        this.attachShadow({ mode: "open" });                // create a shadow DOM for this element
        this.shadowRoot.innerHTML = MyElement.elementHTML;  // set the HTML code for this element through its shadow DOM
        // Set the styling for this element:
        const cssSheet = new CSSStyleSheet();
        cssSheet.replaceSync(MyElement.elementCSS);
        this.shadowRoot.adoptedStyleSheets.push(cssSheet);
    }
    
    /// Action Methods ///

    /** Create a new entry and append it to this view. */
    addEntry(title, time, supers, content) {
        // Create the entry element and add it to this
        const entry = document.createElement("log-view-entry");
        this.shadowRoot.appendChild(entry);
        // Add property values and content to entry (this must be done AFTER entry is added!)
        entry.setAttribute("title", title);
        entry.setAttribute("time", time);
        entry.setAttribute("supers", supers);
        entry.setAttribute("content", content);
        // Scroll to bottom after new entry is added:
        this.scroll({left: 0, top: this.scrollHeight, behavior: "smooth"});
    }

    // removeEntry() {}     // not needed, would be handled by entry element itself (delete itself)

    /** Remove all entries (reset). */
    clearContent() {
        this.shadowRoot.HTMLCode = MyElement.elementHTML;
    }

    /** Hide this view. */
    hide() {
        let style = window.getComputedStyle(this);
        if (style.display !== "none") {
            let sheet = new CSSStyleSheet
            sheet.replaceSync( `:host { display: none }`);
            this.shadowRoot.adoptedStyleSheets.push(sheet);
        }
    }

    /** Show this view. */
    show() {
        let style = window.getComputedStyle(this);
        let sheets = this.shadowRoot.adoptedStyleSheets;
        if (style.display == "none" && sheets.length > 1) {
            sheets.pop();
        }
    }
}
);


/////////////////////////////////////////////////////////////////////////////////
// Log-View Entry

customElements.define("log-view-entry", class MyElement extends HTMLElement {

    /// HTML and CSS Code for this Element ///

    static elementHTML = `
        <div class="header1">
            <span class="time"></span>
            <span class="supers"></span>
        </div>
        <div class="header2">
            <span class="title"></span>
        </div>
        <hr>
        <p class="content"></p>
    `;
    static elementCSS = `
        :host {
            border: 1px solid black;
            border-radius: 3px;         /* gives the border rounded corners */
            padding: 2px;
            background-color: rgba(255, 255, 255, 0.35);
        }
        .header1 {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            font-size: 0.8em;
        }
        .header2 {
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        .title {
            font-weight: bold;
            font-size: 1.2em;
            align-self: center;
        }
        .supers {
            color: #34344A;
        }
        .content {
            margin: 1rem;
        }

        /* Spawn Animation */
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

    /// Setup/Lifecycle Methods ///

    static observedAttributes = ["time", "title", "supers", "content"];
    
    constructor() {
        super();
        this.title;
        this.time;
        this.supers;
        this.content;
    }

    connectedCallback() {
        this.attachShadow({ mode: "open" });                // create a shadow DOM for this element
        this.shadowRoot.innerHTML = MyElement.elementHTML;  // set the HTML code for this element through its shadow DOM
        // Set the styling for this element:
        const cssSheet = new CSSStyleSheet();
        cssSheet.replaceSync(MyElement.elementCSS);
        this.shadowRoot.adoptedStyleSheets.push(cssSheet);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (newValue !== oldValue) {                        // only proceed if the new value is actually different from the old value 
            const subElement = this.shadowRoot.querySelector("." + name);
            subElement.innerText = newValue;
        }
    }

    /// Action Methods ///

    delete() {
        this.remove();
    }

}
);

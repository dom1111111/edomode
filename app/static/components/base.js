
/////////////////////////////////////////////////////////////////////////////////
// Page-Viewer

// (INCOMPLETE)

// __NOTES__
//
// Functionality to Implement: 
// - slide tabs to reorder, 
// - click to go to tab, 
// - "X" to close/remove tab (and its content). Appears on hover (or in focus)
// - right side is un-movable button(s) for certain stuff? settings?
// - this class stores currently in focus tab
// - all tabs tracked by unique title - set as its ID
//
// Coding Details:
// - tabs themselves should be spans, NOT buttons. Maybe the "x" can be a button, otherwise that's just a div or another span
// - the pages are just divs with IDs corresponding to the page title

customElements.define("page-viewer", class MyElement extends HTMLElement {
    
    /// HTML and CSS Code for this Element ///

    // INCOMPLETE - must test this out
    static elementHTML = `
        <div id="tab-bar" class="bar-section">
            <span class="tab">Tab 1</span>
            <span class="tab">Tab 2</span>
            <span class="tab">Tab 3</span>
        </div>
        <div id="view-container">
            <div class="page">Page 1</div>
        </div>
    `;
    static elementCSS = `
        :host {
            display: flex;
            align-items: stretch;
                /* the flex properties make it so that the element within this will take up all available space */
                /* just need to also have the contained element use 'flex: 1' as well */ 
        }
    `;

    /// Setup/Lifecycle Methods ///

    constructor() {
        super();
        this.pages = [];                                    // this will hold the title strings for all of the pages
        this.currentPage;                                   // this will hold the title string for the page that's currently in focus
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

    addPage(title, element) {

    }

    goToPage(title) {

    }

    removePage(title) {

    }

    pageLeft() {

    }

    pageRight() {

    }
}
);

/////////////////////////////////////////////////////////////////////////////////
// Page-Viewer Tab-Bar



/////////////////////////////////////////////////////////////////////////////////
// Page-Viewer Tab
// (ONLY IF NEEDED)


/////////////////////////////////////////////////////////////////////////////////
// Command-Bar

customElements.define("command-bar", class MyElement extends HTMLElement {

    /// HTML and CSS Code for this Element ///

    static elementHTML = `
        <textarea id="text-input" rows=1 placeholder="enter command... " wrap=></textarea>
    `;
    static elementCSS = `
        :host {
            /* the following makes it so that the text input element takes up total space while still fitting: */
            display: flex;
            flex-direction: column;
            align-items: stretch;
        }

        #text-input {
            padding: 5px;
            outline: none;                      /* disables the outline when in focus */
            border: 2px solid transparent;      /* keeps border, but removes color */
            background-color: transparent;
            font-size: inherit; 
            color: inherit;
            resize: none;                       /* makes it so that it can't be resized */
        }

        #text-input:focus {                     /* add a strong border highlight when in focus */
            border-color: rgb(55, 176, 94);
        }
    `;

    /// Setup/Lifecycle Methods ///

    constructor() {
        super();
        this._textInput;                                    // will hold the text input element
        this._action;                                       // the function that should be called when input is entered
        this._lastScrollHeight;                             // holds the previous scroll height, used for automatically resizing the text input element
    }

    connectedCallback() {
        this.attachShadow({ mode: "open" });                // create a shadow DOM for this element
        this.shadowRoot.innerHTML = MyElement.elementHTML;  // set the HTML code for this element through its shadow DOM
        // Set the styling for this element:
        const cssSheet = new CSSStyleSheet();
        cssSheet.replaceSync(MyElement.elementCSS);
        this.shadowRoot.adoptedStyleSheets.push(cssSheet);

        this._textInput = this.shadowRoot.getElementById("text-input");     // instantiate attribute for the text input element

        // this._textInput.addEventListener("input", (e) => {                  // event listener for automatically resizing the text input element 
        //     // NOTE: this breaks if you ever let the textarea element be resizable!!!
        //     // THIS IS BROKEN
            
        //     // let style = window.getComputedStyle(this._textInput);
        //     console.log(e.target.scrollHeight, e.target.scrollHeight);
        //     console.log(e.target.scrollWidth, e.target.scrollWidth);
        //     console.log(style.fontSize, typeof style.fontSize);
        //     console.log(style.font, style.fontFamily);

        //     if (e.target.scrollHeight > this._lastScrollHeight) {
        //         e.target.rows += 1                                          // if the current scroll height is greater than the last, increase the number of rows by 1
        //     } else if (e.target.scrollHeight < this._lastScrollHeight) {
        //         if (e.target.rows > 1) {
        //             e.target.rows -= 1                                      // otherwise, decrease the rows by 1, but never go below 1
        //         }
        //     }
        //     this._lastScrollHeight = e.target.scrollHeight;                 // update the last scroll height with this current one
        // });

        this._textInput.addEventListener("keyup", (e) => {                  // event listener for triggering action when input is entered
            if (e.key === 'Enter' && e.ctrlKey && e.target.value) {
                // ^ if the enter key was pressed while holding ctrl, and the input was not empty, then:
                this._triggerAction();
            }
        });
    }

    /** The method that's called when input is entered, triggering action function */
    _triggerAction() {
        if (typeof this._action === "function") {           // if there is a registered action function,
            this._action(this._textInput.value);            // then call the command action func, and pass in the input element text as argument.
        }
        this._textInput.value = "";                         // clear the input element content
        // this._textInput.rows = 1;                           // reset its number of rows back to 1
        // this._lastScrollHeight = this._textInput.scrollHeight;  // and reset the last scroll height with current one
    }

    /// Support Methods ///



    /// Action Methods ///

    /**
     * @param {Function} func The function which will be called when text input is entered. 
     * The function must accept a single string argument, as the input value will be passed 
     * to it when it's called.
     */
    set action(func) {
        if (typeof func !== "function") {
            throw new Error("Parameter must be a function!");
        }
        this._action = func;
    }

    get action() {
        return this._action;
    }
}
);

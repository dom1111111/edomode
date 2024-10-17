
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

    /** 
     * Convert a string into an array of tokens, split at whitespace and quoted passages.
     * @param {string} str - the string to parsed into tokens.
     * @returns {Array.<string>} - an array with each string token.
     */
    parseStrToTokens(str) {
        var tokens = [];                                    // stores each string token
        var currentToken = "";                              // stores the current token that a character should go in
        var quoted = false;                                 // whether or not the character is within a quoted passage
        // Iterate through each character in the string:
        for (const char of str) {
            if (!char.trim() && !quoted) {                  // if the current character is whitespace (`trim()` leaves an empty string if only whitespace) and not part of a quoted passage in the string
                if (currentToken) {                         // and if the current token isn't empty,
                    tokens.push(currentToken);              // then add the token to the array of tokens
                    currentToken = "";                      // and reset the current token to be empty again.
                }
            } else if (char === '"') {                      // if the current character is a quote `"`,
                if (quoted) {                               // and if the current token is quoted, then this quote character signifies the END of a quoted passage in the string,
                    tokens.push(currentToken);              // and so add the token to the array of tokens
                    currentToken = "";                      // and reset the current token to be empty again    
                    quoted = false;                         // and reset quoted to be false.
                } else {                                    // otherwise if the current token is NOT quoted, then this quote character signifies the START of a quoted passage,
                    quoted = true;                          // and so quoted should be set to true.
                }
            } else {                                        // if the character is not a whitespace OR a whitespace in a quoted passage of the string,
                currentToken += char                        // then just append the character to the current string.
            }
        }
        if (currentToken) {                                 // if there is still a current token left,
            tokens.push(currentToken);                      // then add it to the array of tokens.
        }
        // Return the array of string tokens:
        return tokens;
    }

    /**
     * Parse an array of string tokens into a command parameters: name, positional arguments, and named 
     * arguments. Any tokens starting with a double dash `--` will be considered as named arguments, and 
     * any subsequent tokens after those (which don't have double dashes themselves) will be considered 
     * as values for those named arguments. This means that any tokens used for commands *must* follow 
     * this order: name (first token), positional arguments (tokens after first one but before any named), 
     * named arguments. 
     * Additionally, if a named argument token has no subsequent values (so either immediately followed by 
     * other named argument tokens or it itself is the last token), then it will be considered as a boolean 
     * flag and be given the value `true`.
     * 
     * @param {Array.<string>} tokens - an array of string tokens.
     * @returns {Object} - an object organizing the tokens into command parameters.
     */
    parseTokensToParams(tokens) {
        let name = tokens[0];                               // get the command name from the first token
        let pargs = [];
        let currentNarg;
        let nargs = {};
        
        for (var tok of tokens.slice(1)) {                // iterate through the token array starting after the first token
            if (!tok.startsWith('--')) {                    // if the token doesn't start with `--`,
                if (Number(tok)) {
                    tok = Number(tok);                      // then first, if the string token can become a number, make it a number
                }
                if (!currentNarg) {                         // and if there hasn't been any named arguments yet
                    pargs.push(tok);                        // then append this token to the positional argument array
                } else {
                    nargs[currentNarg].push(tok);           // but is there HAS been a named argument, then add this token to the array attached to the named argument key in the object for named args
                }
            } else {                                        // if the token DOES start with `--`,
                let nargName = tok.replace('--', '');       // then firstly remove the starting `--` from it,
                currentNarg = nargName;                     // set the current named argument to be this token
                nargs[nargName] = [];                       // create a new key/value for this in the object for named args
            }
        }
        
        for (const name in nargs) {                         // now iterate through each key name in the named arguments object
            let val = nargs[name];                          // get the value attached to the name
            if (val.length === 1) {                         // if the array value for the named argument only has one item in it
                nargs[name] = val[0];                       // then change the value to just be that item instead of an array holding it.
            } else if (val.length < 1) {                    // otherwise is the array has NO items in it,
                nargs[name] = true                          // then change the value to be `true` instead of an empty array
            }
        }

        return {                                            // finally, return an object containing each command parameter
            name: name,
            pargs: pargs,
            nargs: nargs
        }
    }

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

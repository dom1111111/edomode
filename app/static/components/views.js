import {CustomElementBase, CSSToStyleSheet} from "../modules/component-tools.js";

const sepr = ",|,"

/////////////////////////////////////////////////////////////////////////////////
// Log-View

customElements.define("log-view", class LogView extends CustomElementBase {
    
    /// HTML and CSS Code for this Element ///

    static elementCSS = `
        :host {
            flex: 1;
            padding: 2px;
            display: flex;
            flex-direction: column;
            /* align-items: flex-start; */
            overflow-y: auto;           /* makes it so that if this grows past its parent height, it will scroll vertically */
            gap: 4px;
        }

        /*
        * {
            width: 75%;
        }
        */
    `;

    ///

    static styleTypeCSS = {                                 // the extra styles to apply to certain entry child elements
        message: `
            :host {
                /* align-self: flex-end; */
                background-color: blue;
            }
        `,
        error: `
            :host {
                /* align-self: flex-end; */
                background-color: red;
            }
            .content {
                text-align: end;
            }
        `,
    }

    /// Setup/Lifecycle Methods ///

    constructor() {
        super();
    }
    
    /// Action Methods ///

    /**
     * Create a new entry and append it to this log view.
     * 
     * @param {Object} properties - an object containing a key/value for all properties that the entry should remember and display.
     * @param {string} styleType - the type of styling that should be used for this entry.
     */
    addEntry(properties, styleType="note") {
        // 1) Ensure that `properties` has all needed properties for entry display:
        const baseProps = ["time", "content"];  // "title",
        for (const prop of baseProps) { 
            if (!properties.hasOwnProperty(prop)) {
                throw new Error(`The 'properties' argument object for the log entry is missing the "${prop}" property`)
            }
        }
        // 2) Create the new log entry element and add it within this one (log-view):
        const entry = document.createElement("log-entry");
        this.shadowRoot.appendChild(entry);
        // 3) Set the properties of the entry: (this should be done AFTER entry is added!)
        for (let [name, val] of Object.entries(properties)) {
            if (Array.isArray(val)) {
                val = val.join(sepr);                       // if the value is an array, then join it into a string using a global separator 
            }
            entry.setAttribute(name, val);
        }
        // 4) Adjust the style of the entry element based on the the `styleType`:
        if (this.constructor.styleTypeCSS.hasOwnProperty(styleType)) {      // only some styleTypes need to be adjusted
            const styleSheet = CSSToStyleSheet(this.constructor.styleTypeCSS[styleType]);   // create a new stylesheet from the matching CSS code
            entry.shadowRoot.adoptedStyleSheets.push(styleSheet);           // add the new stylesheet to the element, so that the new styles take effect
        }
        // 5) Finally, scroll to bottom of this view so that the entry element is visible:
        this.scroll({left: 0, top: this.scrollHeight, behavior: "smooth"});
    }

    /** Remove all entries (reset). */
    clearAll() {
        this.shadowRoot.innerHTML = this.constructor.elementHTML;
    }
    
});


/////////////////////////////////////////////////////////////////////////////////
// Tree-View




/////////////////////////////////////////////////////////////////////////////////
// Schedule-View




/////////////////////////////////////////////////////////////////////////////////

///////////////////////////
// Log View Entry

customElements.define("log-entry", class LogEntry extends CustomElementBase {

    /// HTML and CSS Code for this Element ///

    static elementHTML = `
        <div class="header">
            <span class="title"></span>
            <span class="time"></span>
        </div>
        <hr>
        <div class="properties">
            <!-- (FOR REFERENCE:)
            <span class="prop">
                <span class="prop-name"></span>
                <a class="prop-val"></a>
            </span>
            -->
        </div>
        <p class="content"></p>
    `;

    static elementCSS = `
        :host {
            border-radius: 3px;         /* gives the border rounded corners */
            padding: 2px;
            background-color: rgb(142, 142, 142);

            animation-name: slidegrow;  /* spawn animation: */
            animation-duration: 0.2s;
        }
        
        @keyframes slidegrow {          /* spawn animation code */
            0% {
                translate: -100vw 0;    /* start completely off screen from the left */
                scale: 0%;
            }
            100% {
                translate: 0 0;
                scale: 100%;
            }
        }

        .header {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            padding: 5px;
        }

        .header > * {
            font-size: 0.75em;
            color: #314551;
        }
        
        .header > .title {
            font-weight: bold;
        }

        hr {
            margin: 0;                  /* this is needed as it has a margin by default */
        }

        .properties {
            display: flex;
            flex-flow: row wrap;        /* direction and wrap */
            gap: 2px;
            margin: 2px;
            color: #34344A;
            font-size: 0.8em;
        }

        .properties > .prop {
            border: 1px solid black;

        }

        .properties > .prop > * {
            display: inline-block;
            margin: 2px;
        }

        .properties > .prop > .prop-name {
            font-weight: bold;
        }

        .properties > .prop > .prop-val {
            background-color: rgb(106, 138, 142);
        }

        .content {
            margin: 1rem;
        }
    `;

    /// Setup/Lifecycle Methods ///

    static observedAttributes = ["title", "time", "content", "tags"];   // the attributes which correspond to all possible log entry property names 
    static defaultProps = ["title", "time", "content"];     // the default property names, which have their own specific position and styling outside of the 'properties' element
    
    constructor() {
        super();
    }

    connectedCallback() {
        super.connectedCallback();                          // set up the shadow DOM, HTML, and CSS for this element 
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (newValue === oldValue) {return}                 // only proceed if the new value is actually different from the old value 
        if (this.constructor.defaultProps.includes(name)) { // if the attribute name is one of the class' default properties,
            const childElement = this.shadowRoot.querySelector("." + name); // then get the child element with the same class name as the attribute name
            childElement.innerText = newValue;              // and set the inner text of the child-element to be the new value
        } else {                                            // otherwise, if its not a default property, render it in the "properties" element
            // Create span element for the overall property container:
            const prop = document.createElement("span");
            prop.classList.add('prop');
            // Create span element for property name and add it to the property element:
            const propName = document.createElement("span");
            propName.classList.add('prop-name');
            propName.innerText = name + ':';
            prop.appendChild(propName);
            // Create span element(s) for property value(s) and add to the property element:
            newValue = newValue.split(sepr);                // turn value into array by splitting it with the global separator (this handles both values which were originally arrays or non arrays)
            for (const val of newValue) {                   // iterate through the array of values, creating an element for each
                const propVal = document.createElement("a");
                propVal.classList.add('prop-val');
                propVal.innerText = val;
                prop.appendChild(propVal);
            }
            // Finally, add the new complete property element to the main "properties" element:
            const propsElement = this.shadowRoot.querySelector(".properties");
            propsElement.appendChild(prop);
        }
    }


    /// Action Methods ///

    /** Completely delete this element. Will be removed from it's parent node.  */
    delete() {
        this.remove();
    }

});

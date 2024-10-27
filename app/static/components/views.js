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

    /**
     * Create a new entry and append it to this view.
     * 
     * @param {Object} properties - an object containing a key/value for all properties that the entry should remember and display.
     */
    addEntry(properties={}) {
        const entry = document.createElement("view-entry"); // create a new entry element
        this.shadowRoot.appendChild(entry);                 // add the element to this
        entry.setProperties(properties);                    // set the properties of the entry (this must be done AFTER entry is added!)
        this.scroll({left: 0, top: this.scrollHeight, behavior: "smooth"}); // scroll to bottom after new entry is added   
    }

    /** Remove all entries (reset). */
    clearAll() {
        this.shadowRoot.HTMLCode = MyElement.elementHTML;
    }
    
});


/////////////////////////////////////////////////////////////////////////////////
// Tree-View




/////////////////////////////////////////////////////////////////////////////////
// Schedule-View




/////////////////////////////////////////////////////////////////////////////////
// View Entry

customElements.define("view-entry", class MyElement extends HTMLElement {

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
                <span class="name"></span>
                <span class="value"></span>
            </span>
            -->
        </div>
        <p class="content"></p>
    `;
    static elementCSS = `
        :host {
            border-radius: 3px;         /* gives the border rounded corners */
            padding: 2px;
            background-color: rgba(255, 255, 255, 0.35);

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
            padding: 5px 5px 0;
        }
        
        .header .title {
            font-weight: bold;
            font-size: 1.5em;
            align-self: center;
        }

        .header .time {
            font-size: 0.9em;
        }

        .properties {
            display: flex;
            flex-flow: row wrap;        /* direction and wrap */
            gap: 2px;
            margin: 2px;
            color: #34344A;
            font-size: 0.8em;
        }

        .properties .prop {
            border: 1px solid black;
        }

        .properties .prop > * {
            margin: 2px;
        }

        .properties .prop .name {
            font-weight: bold
        }

        .content {
            margin: 1rem;
        }
    `;

    /// Setup/Lifecycle Methods ///

    static defaultProps = ["title", "time", "content"];     // the default property names, which have their own specific position and styling outside of the 'properties' element
    
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
    
        this._propElements = {                              // an object to hold each element which displays the entry properties and values
            title: this.shadowRoot.querySelector(".title"),
            time: this.shadowRoot.querySelector(".time"),
            properties: this.shadowRoot.querySelector(".properties"),
            content: this.shadowRoot.querySelector(".content"),
        }

        this._renderProperties()                            // initially render any content related to properties (which come from this class' attributes, if any at this point)

        // Create a mutation observer and callback to run every time an attribute is changed 
        // (this was used instead of custom element `observedAttributes` mechanic, because this 
        // needs to observe ALL attribute changes, not just a select few which are already known).
        new MutationObserver((mutationRecords) => {
            for (const mutation of mutationRecords) {       // iterate through each mutation (attribute change)
                const oldVal = mutation.oldValue;           // attribute's old value
                const newVal = this.getAttribute(mutation.attributeName);   // attribute's new value
                if (newVal !== oldVal) {                    // If at least one of the new values is different from its old value,
                    this._renderProperties()                // then render all of the properties in the "properties" element,
                    break                                   // and then break the loop.
                }
            }
        }).observe(this, { attributes: true });
    }

    /** 
     * Render all attributes into element content. 
     * 
     * Every attribute is used to store the properties of the entry this is displaying, 
     * and used to define the content of sub-elements which are there to display various 
     * entry properties.
    */
    _renderProperties() {
        for (const attr of this.attributes) {   // iterate through all attributes (which represent entry properties), and create elements to represent them.
            if (MyElement.defaultProps.includes(attr.name)) {           // if the attribute name is one of the default properties,
                this._propElements[attr.name].innerText = attr.value;   // then change the innerText of the element with the matching name, to be the new value  
            } else {                                                    // otherwise, if its not a default property, render it in the "properties" element
                // Create element for property name:
                const propName = document.createElement("span");
                propName.classList.add('name');
                propName.innerText = attr.name;
                // Create element for property value:
                const propVal = document.createElement("span");
                propVal.classList.add('value');
                propVal.innerText = attr.value;
                // Create element for property, and add name and value elements to it:
                const prop = document.createElement("span");
                prop.classList.add('prop');
                prop.appendChild(propName);
                prop.appendChild(propVal);
                // Finally, add the complete property element to the main "OtherProps" element:
                this._propElements["properties"].appendChild(prop);
            }
        }
    }

    /// Action Methods ///

    /**
     * Update and render any of the entry properties. Properties are managed through this element's 
     * attributes, so this function will set an attribute for each property's name and value.  
     * 
     * @param {Object} props - an object with key value pairs for each property name and value.
     */
    setProperties(props={}) {
        for (const [name, value] of Object.entries(props)) {
            this.setAttribute(name, value);
        }
    }

    /** Completely delete this element. Will be removed from it's parent node.  */
    delete() {
        this.remove();
    }

});

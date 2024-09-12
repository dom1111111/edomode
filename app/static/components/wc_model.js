// This is a template/example for a 'web component' custom element. They 
// are always made with classes which extend the base `HTMLElement` class 
// or another existing element class (ex: `div`).

// RESEARCH NOTES: //
// - figuring out how to apply style from CSS code for web component:
//     - https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM#applying_styles_inside_the_shadow_dom
// - general web component info:
//     - https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements


////////////////////////////////////////////////////////////////////
///////// Custom Element Class and Definition/Registration /////////
////////////////////////////////////////////////////////////////////

// The `define` method adds the following custom element to the custom element 
// registry (will be usable throughout the code like any HTML element).
// The first arg is the element name for this web component. The name of 
// custom elements must always contain a hyphen (-). The second arg is the
// custom element class 
customElements.define("new-element", class MyElement extends HTMLElement {

    ////// CUSTOM ELEMENT HTML/CSS CODE //////
    
    // HTML Code:
    static htmlCode = `
    <!-- [HTML CODE GOES HERE] -->
    <h1>This is a brand new custom element!</h1>
    `;

    // Style CSS Code:
    static styleCSS = `
    :host {                                         /* ':host' css pseudo-class applies to the shadow DOM element containing this CSS */
        /* [CSS CODE FOR THIS ELEMENT GOES HERE] */
        flex: 1;
        padding: 2px;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
    }

    /* [OTHER CSS CODE FOR CONTAINED ELEMENTS/CLASSES/ETC.] */
    h1 {
        border: 1px solid white;
        background-color: yellow;
        color: blue;
    }

    span {
        margin: 2px;
        border: 1px solid black;
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
        this.shadowRoot.innerHTML = MyElement.htmlCode; // set the HTML code for this element through its shadow DOM
        // Set the CSS:
        const cssSheet = new CSSStyleSheet();       // setting CSS is done through the `CSSStyleSheet` interface
        cssSheet.replaceSync(MyElement.styleCSS);
        this.shadowRoot.adoptedStyleSheets = [cssSheet];// as usual, attach style sheet through the shadow DOM
    }

    

    ////// Element Accessible Methods //////

    // here's an example of a method which can be called from instances of this element:
    addSpanMsg(msg) {
        const entry = document.createElement("span");   // create a new `span` element
        entry.innerText = msg;                      // set span's inner text to be the `msg`
        this.shadowRoot.appendChild(entry);         // finally, append the new span element to this one (through its shadow root)
    }
}
);
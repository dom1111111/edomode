// This module contains various tools to help create custom elements and reduce code repetition.

/**
 * Create a CSS style sheet from a provided string with CSS code.
 * @param {string} css - a string containing the CSS code for the style sheet.
 * @returns {CSSStyleSheet} The CSS style sheet created from the provided css code string.
 */
function CSSToStyleSheet(css) {
    const styleSheet = new CSSStyleSheet();
    styleSheet.replaceSync(css);
    return styleSheet;
}

/** 
 * This is a class which can be extended to make a custom element class and 
 * already has some properties built in for convenience.
 * Typically, a custom element would just inherit from `HTMLElement` directly,
 * but this acts as a middle class to include all needed code that would 
 * otherwise be repeated across each custom element class definition.
 * 
 * It also includes some particular mechanics for setting HTML and CSS/style.
 * The HTML and CSS are set through static properties, and will be encapsulated 
 * in the element's shadow DOM. Additionally, there's a static property with an 
 * array to hold other style sheets for the element. So if outside styles need to 
 * be added to the element (which is otherwise isolated), then they only need 
 * to be added **ONCE** to the class, rather then needing to add it to every 
 * single instance of that element.
 * 
 * So this is all that needs to be done in a child class of this one to set up a 
 * custom element:
 * - define its HTML through `static elementHTML = "(html code)"`
 * - define its main CSS through `static elementCSS = "(css code)"`
 * - if more functionality needs to be added to the `connectedCallback` method,
 * then extend it by making another `connectedCallback` and add line: 
 * `super.connectedCallback();`
 * - add any other lifecycle callback methods (`disconnectedCallback`, 
 * `adoptedCallback`, `attributeChangedCallback`)
 * 
 * Then in another part of the code, to add extra styling simply append a new 
 * `CSSStyleSheet` to the `otherStyleSheets` static class array property.
 */
class CustomElementBase extends HTMLElement {

    static elementHTML = "";                                // the HTML code of the element
    static elementCSS = "";                                 // the CSS code of the element
    static otherStyleSheets = [];                           // an array for outside CSS Style Sheets

    constructor() {
        super();                                            // calls the constructor of the parent/extender class (`HTMLElement`)  
    }

    /**
     * This will be called each time the element is added to the document.
     * Putting the component setup code in this method (lifecycle callback) is 
     * preferred to putting it in the constructor.
     */
    connectedCallback() {
        this.attachShadow({ mode: "open" });                // create a shadow DOM tree for this element
        const cls = this.constructor;                       // get the class itself (not this instance of it)
        this.shadowRoot.innerHTML = cls.elementHTML;        // setup HTML of element through its shadow DOM, using the HTML code of the class static property   
        this.shadowRoot.adoptedStyleSheets.push(CSSToStyleSheet(cls.elementCSS));   // convert this class' `elementCSS` code to a style sheet, and append that to this instance's adoptedStyleSheets
        this.shadowRoot.adoptedStyleSheets.push(...cls.otherStyleSheets);           // append any other style sheets in the class' `otherStyleSheets` array to this instance's adoptedStyleSheets
    }
}

/**
 * Add CSS code to an element *class* (this should be used BEFORE creating any 
 * instances). This allows the style of an element class to be modified outside 
 * of it, without having to modify each of its instances.
 * 
 * Will convert CSS to a style sheet, and append it to its `allStyleSheets` array.
 * 
 * @param {Function} elementClass - a custom element class to add the CSS code to.
 * @param {string} css - the CSS code to apply to the class.
 */
function addCSSToCustomElement(elementClass, css) {
    elementClass.allStyleSheets.push(CSSToStyleSheet(css)) // convert the provided CSS code to a style sheet, and append that to the class' `allStyleSheets` array
}

/////////////////////////////////////////////////////////////////////////////////

export {CSSToStyleSheet, CustomElementBase, addCSSToCustomElement}

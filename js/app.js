// Card Data from: https://mobile.think2perform.com/our-approach/values/new
const SAVE_LOCATION = "value-sort";
const CARDS = [];
const BINS = {
    "veryImportant": [],
    "somewhatImportant": [],
    "notImportant": []
};

// test to see if browser has localStorage enabled
const hasLocalStorage = checkForLocalStorage();

const cardsContainer = document.getElementById("cards");

/**
 * Fetch data and intitialize the UI components.
 */
(async function initUI() {
    // add drop listeners to the card bins
    addDropDetection();

    // get the cards data
    const response = await fetch("data/cards.json");
    const data = await response.json();

    // add to the cards global variable to be used for rendering
    CARDS.push(...data.cards);
    
    if (hasLocalStorage)
    {
        // get data from localStorage
        let data = localStorage.getItem(SAVE_LOCATION);

        // try to parse data as JSON, it will throw an error if nothing was stored
        try
        {
            data = JSON.parse(data);
        } catch {}

        // check if there were saved bins
        if (data.bins)
        {
            // keep track of cards that should not show up in the general container
            const usedCards = [];

            // populate bins and render
            [...document.querySelectorAll("#bins div")]
                .forEach(bin => {
                    // add the cards from localStorage into the bins object
                    BINS[bin.id].push(...data.bins[bin.id]);

                    // keep track of the cards that are already in bins
                    usedCards.push(...data.bins[bin.id]);

                    // render all the values in the bins
                    BINS[bin.id].forEach(card => addValueToBin(bin, card));

                    // show the count of values in the bin
                    bin.parentNode.querySelector(".count").textContent = BINS[bin.id].length;
                });

            // remove any used cards from the cards array
            // TODO maybe change to modify a deep copy of cards just as to not lose data
            usedCards.forEach(card => {
                CARDS.splice(CARDS.findIndex(x => x.name == card.name), 1);
            });
        }
    }

    // render the cards on the bottom of the screen
    CARDS.forEach(createCard);
})();

/**
 * Add drop detection to the card bins so that cards can be removed from the main container and instead be placed 
 * in a pile.
 */
function addDropDetection() {
    // go through all bin divs to add drop detection
    [...document.querySelectorAll("#bins div")]
        .forEach(bin => {
            // prevent default dragover behavior to allow for ondrop listening
            bin.ondragover = e => e.preventDefault();

            // listen for draggable items being dropped onto a bin
            bin.ondrop = e => {
                // prevent default drop behavior
                e.preventDefault();

                // get the card information that was dropped into the bin
                const card = JSON.parse(e.dataTransfer.getData("card"));

                // add the card to the bin
                BINS[bin.id].push(card);

                // add the value from the card to the bin
                addValueToBin(bin, card);

                // show the count of values in the bin
                bin.parentNode.querySelector(".count").textContent = BINS[bin.id].length;

                // remove the card from the card container
                document.getElementById(card.name.split(" ").join("")).remove();

                // save the updated bin state
                saveData(card);

                // TODO check if all the cards are gone from the container?
            }
        });
}

/**
 * Add a value to a bin.
 * @param {HTMLELement} bin 
 * @param {Object} card 
 */
function addValueToBin(bin, card) {
    // add the value to the bin
    const valueEl = createElement(bin, "p", { text: card.name });

    // add delete button or something to allow removal of value from bin
    createElement(valueEl, "span", {
        html: "&nbsp;&#9447;",
        onclick: () => {
            // remove the value from the bin array
            BINS[bin.id].splice(BINS[bin.id].findIndex(x => x.name == card.name), 1);

            // save the changed bin state
            saveData();

            // remove the value from the bin display
            valueEl.remove();

            // show the count of values in the bin
            bin.parentNode.querySelector(".count").textContent = BINS[bin.id].length;

            // add the card to the card container
            createCard(card);
        }
    });
}

/**
 * Create a card element in the card container.
 * @param {Object} card 
 */
function createCard(card) {
    // create an element to hold the different parts of the card
    const cardEl = createElement(cardsContainer, "div", {
        id: card.name.split(" ").join(""),
        class: "card",
        draggable: true,
        ondragstart: e => {
            e.dataTransfer.setData("card", JSON.stringify(card));
        }
    });

    // create a header for the value name
    createElement(cardEl, "h3", { 
        class: "text-center",
        text: card.name 
    });

    // create a span that is hidden by default that houses the value's description
    const descriptionEl = createElement(cardEl, "span", {
        class: "text-center hidden",
        text: card.description
    });

    // create an "info" button that can toggle the visibility of the value description
    createElement(cardEl, "span", {
        html: "&#9432;",
        onclick: () => descriptionEl.classList.toggle("hidden")
    });
}

/**
 * Save user state to localStorage for data persistence.
 */
function saveData() {
    // check if browser has localStorage enabled first
    if (hasLocalStorage)
    {
        // save all state
        localStorage.setItem(SAVE_LOCATION, JSON.stringify({
            bins: BINS
        }));
    }
}

/**
 * Create an HTML element and add it to the DOM tree.
 * @param {HTMLElement} parent 
 * @param {String} tag 
 * @param {Object} attributes 
 */
function createElement(parent, tag, attributes={}) {
    // create the element to whatever tag was given
    const el = document.createElement(tag);
    
    // go through all the attributes in the object that was given
    Object.entries(attributes)
        .forEach(([attr, value]) => {
            // handle the various special cases that will cause the Element to be malformed
            if (attr == "innerText") 
            {
                el.innerText = value;
            }
            else if (attr == "html") 
            {
                el.innerHTML = value;
            }
            else if (attr == "text") 
            {
                el.textContent = value;
            }
            else if (attr == "onclick")
            {
                el.onclick = value;
            }
            else if (attr == "ondragstart")
            {
                el.ondragstart = value;
            }
            else if (attr == "onkeydown")
            {
                el.onkeydown = value;
            }
            else
            {
                el.setAttribute(attr, value);
            }
        });
    
    // add the newly created element to its parent
    parent.appendChild(el);

    // return the element in case this element is a parent for later element creation
    return el;
}

/**
 * Check if localStorage exist and is available.
 * https://stackoverflow.com/questions/16427636/check-if-localstorage-is-available/16427747
 * @return {Boolean} localStorageExists
 */
function checkForLocalStorage(){
    const test = "test";

    try {
        localStorage.setItem(test, test);
        localStorage.removeItem(test);

        return true;
    } catch(e) {
        return false;
    }
}
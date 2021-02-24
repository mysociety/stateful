# stateful.js

A JavaScript library to help with mocking out interactive features in mySociety static prototypes.

## Use this library

Include `stateful.js` or `stateful.min.js` after jQuery, then initialise it:

```html
<script src="path/to/jquery.min.js"></script>
<script src="path/to/stateful.min.js"></script>
<script>
var stateful = new Stateful();
</script>
```

## See a demo

Run `make demo`, or open `demo/index.html` in your web browser.

## Run the tests

Run `make test`, or open `test/SpecRunner.html` in your web browser.

## Compile the minimized version

You’ll need the Closure Compiler, which you can get with `brew install closure-compiler` or directly from Google's website. If you use brew (or otherwise create a closure-compiler script in your PATH), you can run `make dist`, or otherwise you can run: `make dist COMPILER='java -jar path-to-compiler.jar'`.

# Documentation

*stateful.js* works as a one-dimensional key-value store. You store values (typically the `value` attribute/property of a form input) under keys (such as the `name` attribute of that input). *stateful.js* then populates or manipulates HTML elements based on those stored key-value pairs.

You tell *stateful.js* which elements to monitor and manipulate by adding [data attributes](https://html.spec.whatwg.org/multipage/dom.html#attr-data-*) to the elements.

*stateful.js* runs when you first call `new Stateful()` (“initialisation”), whenever a `change` event is detected on an element with a `data-st8-key` attribute, or whenever you manually call the `stateful.applyState()` method.

One manipulation *stateful.js* can perform is showing/hiding an element based on changes to the stored state. In these cases, it adds `aria-controls`, `aria-expanded`, and `aria-hidden` attributes to elements where required. It will also auto-generate a unique `id` attribute for any elements that need to be shown/hidden (and therefore need to be referenced in another element’s `aria-controls` attribute).

## Data attributes

For brevity, all of the data attributes start with `data-st8`. Here is the full list:

---

### `data-st8-key="[key]"`

Tie this HTML element to the given `[key]`.

When used without any other `data-st8` attributes, *stateful.js* will automatically update either the `value` or the text content of this element to reflect changes in the stored value of the `[key]`.

When used with other `data-st8` attributes (such as `data-st8-show-if-set`), *stateful.js* will perform other manipulations on the element, as defined by other `data-st8` attributes.

Examples:

```html
<input type="text" data-st8-key="email">
<p>Your email is: <span data-st8-key="email"></span></p>
```

```html
<label><input type="checkbox" value="remember-me" data-st8-key="remember"> Remember me</label>
<p data-st8-key="remember" data-st8-show-if-set="remember-me">A cookie will be stored on your device</p>
```

---

### `data-st8-show-if-set` and `data-st8-hide-if-set`

Show or hide this element if a value has been stored for the given `data-st8-key`.

Note: this is a [boolean attribute](https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#boolean-attribute) which doesn’t take any values itself. It uses whatever’s been set as the `data-st8-key` for the element.

Examples:

```html
<label><input type="checkbox" data-st8-key="has-pin" value="yes"> I already have a PIN</label>
<p data-st8-key="has-pin" data-st8-show-if-set>
  <label>Enter your PIN <input type="password"></label>
</p>
```

---

### `data-st8-show-if-value="[value]"` and `data-st8-hide-if-value="[value]"`

Show or hide this element if the stored value for the given `data-st8-key` matches the given `[value]`.

This is useful for displaying elements to the user based on their previous selections in a form.

Examples:

```html
<select data-st8-key="location">
    <option value="a">Site A</option>
    <option value="b">Site B (unsupported)</option>
    <option value="c">Site C</option>
</select>
<p data-st8-key="location" data-st8-show-if-value="b">
    We do not currently accept reports at Site B.
</p>
```

---

### `data-st8-show-unless-value="[value]"` and `data-st8-hide-unless-value="[value]"`

Show or hide this element _unless_ the stored value for the given `data-st8-key` matches the given `[value]`.

These attributes are effectively the opposites of the `data-st8-show-if-value` / `data-st8-hide-if-value` attributes, and are useful when you want to show one element for one choice in a set of options, but show another element for all other choices.

```html
<select data-st8-key="location">
    <option value="a">Site A</option>
    <option value="b">Site B (unsupported)</option>
    <option value="c">Site C</option>
</select>
<p data-st8-key="location" data-st8-show-unless-value="b">
    Your site manager is Alice.
</p>
<p data-st8-key="location" data-st8-show-if-value="b">
    We do not currently accept reports at Site B.
</p>
```

## Initialisation options

In most cases, you won’t need to pass any options when initialising `Stateful` on a page:

```javascript
var stateful = new Stateful();
```

You may, however, pass the following initialisation options, if you want to customise the behaviour of *stateful.js*:

---

### `root`

By default, *stateful.js* will attach event listeners to the root document element `window.document`, so that events can be detected on stateful elements added to the page _after_ initialisation.

It also appends a short CSS stylesheet to the root element, to hide `aria-hidden="true"` stateful elements.

If you want to attach these global listeners and the stylesheet to a different element, pass a DOM element or jQuery object as the `root` parameter. eg:

```javascript
var $el = $('.site-content');
var stateful = new Stateful({ root: $el });
```

## Public methods

Sometimes you might want to interact with the *stateful.js* store directly. Assuming you’ve stored a reference to the `Stateful` instance, there are public methods which allow you to do this:

---

### `stateful.getState(key)`

If a `key` is provided, return the stored `value` for that `key` in the stateful store.

```html
<input type="text" data-st8-key="name" value="Alice">
<script>
var stateful = new Stateful();
console.log( stateful.getState('name') ); // Prints: "Alice"
</script>
```

If no `key` is provided, return the entire store, as a key-value object.

```html
<input type="text" data-st8-key="name" value="Alice">
<script>
var stateful = new Stateful();
console.log( stateful.getState() ); // Prints: { name: "Alice" }
</script>
```

Note that values from the stateful store can sometimes be arrays, for example, if they’ve been created by a `select[multiple]` element.

```html
<select multiple data-st8-key="sites">
    <option selected>Site A</option>
    <option>Site B</option>
    <option selected>Site C</option>
</select>
<script>
var stateful = new Stateful();
console.log( stateful.getState() ); // Prints: { sites: [ "Site A", "Site C" ] }
</script>
```

---

### `stateful.applyState()`

Apply the saved state to stateful elements on the page.

You **must** call this method after manually updating or clearing the stored state, if you want your changes to be reflected on the page.

*stateful.js* runs this method once when you first initialise `new Stateful()` on the page.

---

### `stateful.updateState(key, value)`

If a `value` is provided, overwrite the stored value for `key` with the new `value`.

```html
<label><input type="checkbox" data-st8-key="remember" value="yes"> Remember me</label>
<script>
var stateful = new Stateful();
stateful.updateState('remember', 'yes');
stateful.applyState(); // The checkbox will now be checked!
</script>
```

If no `value` is provided, remove the `key` from the store.

```html
<label><input type="checkbox" data-st8-key="remember" value="yes" checked> Remember me</label>
<script>
var stateful = new Stateful();
console.log( stateful.getState() ); // Prints: { remember: "yes" }
stateful.updateState('remember');
console.log( stateful.getState() ); // Prints: { }
stateful.applyState(); // The checkbox will now be unchecked!
</script>
```

---

### `stateful.clearState()`

Clear all keys and values from the stored state.

```html
<script>
var stateful = new Stateful();
stateful.updateState('remember', 'yes');
console.log( stateful.getState() ); // Prints: { remember: "yes" }
stateful.clearState();
console.log( stateful.getState() ); // Prints: { }
</script>
```

## Objective

Validate all requests from the page that will add or modify email values

* If exists an email value that doesn't allow, should alert user and cancel the request

## TODO

* How to get the set of allowed email values?
  * Make an app to manage email values that can be used
  * Email values should be managed in pattern forms (e.g. regular expresion)
  * Provide a private API to get the set of that email values
  * The extension should allow user to config this API parameters
* Intercept the request
  * Using webRequest API
  * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest
  * Parse request body to validate values
* Other stuff
  * Config pages should run this extension
  * Develop option page

## Options page

Give users options: https://developer.chrome.com/docs/extensions/mv3/options/

Using options page and *storage APIs* to save the extension's user options.

* Chrome: https://developer.chrome.com/docs/extensions/reference/storage/
* Firefox: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/StorageArea


```js
chrome.storage.sync.set({ key: value }).then(() => {
  console.log("Value is set to " + value);
});

chrome.storage.sync.get(["key"]).then((result) => {
  console.log("Value currently is " + result.key);
});
```

## Call API

Call an external API from the extension with [fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)


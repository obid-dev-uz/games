// Runtime APIs newer than our oldest supported engine (Android WebView 88)
// that dependencies call. The build only lowers syntax, not missing methods.

// Chrome 93+; used by Pinia.
if (!Object.hasOwn) {
  Object.defineProperty(Object, "hasOwn", {
    value: (object, key) => Object.prototype.hasOwnProperty.call(object, key),
    configurable: true,
    writable: true,
  });
}

/**
 * Creates an ExtensionStorage Proxy object that adds a warning to console when extensionStorage is updated.
 * The purpose is so that it can yell at extension developers to not use extensionStorage.
 */
const ExtensionStorage = (default_content = {}) => {
  return new Proxy(
    default_content,
    {
      set: function (target, key, value) {
        console.warn("extensionStorage APIs are deprecated. Please avoid using them in your extensions.");
        return target[key] = value;
      },
    }
  );
};

module.exports = ExtensionStorage;

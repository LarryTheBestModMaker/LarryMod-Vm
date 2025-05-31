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

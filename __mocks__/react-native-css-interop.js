// NativeWind CSS interop mock for Jest
// Uses property access to get createElement without babel transforming it
const React = require('react');
const origCreateElement = React['createElement'];

module.exports = {
  cssInterop: function () {},
  remapProps: function () {},
  createInteropElement: function (type, props) {
    var children = Array.prototype.slice.call(arguments, 2);
    return origCreateElement.apply(React, [type, props].concat(children));
  },
  useColorScheme: function () {
    return { colorScheme: 'light' };
  },
  vars: function () {},
  useUnstableNativeVariable: function () {},
};

"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _hoek = require("hoek");

var _hoek2 = _interopRequireDefault(_hoek);

var _loadConfigs = require("./loadConfigs");

var _loadConfigs2 = _interopRequireDefault(_loadConfigs);

var Config = (function () {
  function Config() {
    _classCallCheck(this, Config);

    this.values = _loadConfigs2["default"]();
  }

  Config.prototype.get = function get(prop) {

    var val = undefined;

    if (!prop) {
      val = _hoek2["default"].clone(this.values);
    } else {
      val = _hoek2["default"].clone(_hoek2["default"].reach(this.values, prop));
    }

    return val;
  };

  return Config;
})();

exports["default"] = Config;
module.exports = exports["default"];
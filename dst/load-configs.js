"use strict";

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _os = require("os");

var _os2 = _interopRequireDefault(_os);

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _hoek = require("hoek");

var _hoek2 = _interopRequireDefault(_hoek);

var _jsYaml = require("js-yaml");

var _jsYaml2 = _interopRequireDefault(_jsYaml);

var _minimist = require("minimist");

var _minimist2 = _interopRequireDefault(_minimist);

var argv = _minimist2["default"](process.argv.slice(2));
var env = {};
var configSources = [];

var initParam = function initParam(paramName, defaultValue) {

  var value = argv[paramName] || process.env[paramName] || defaultValue;
  env[paramName] = value;
  return value;
};

var initConfigDir = function initConfigDir(paramName, configDir) {

  if (!configDir) {
    configDir = initParam(paramName, _path2["default"].join(process.cwd(), "config"));
  }

  if (!_path2["default"].isAbsolute(configDir)) {
    configDir = _path2["default"].join(process.cwd(), configDir);
  }

  return configDir;
};

var getHostName = function getHostName(hostName) {

  // Determine the host name from the OS module, $HOST, or $HOSTNAME
  // Remove any . appendages, and default to null if not set
  try {
    // Store the hostname.
    env.HOSTNAME = hostName;

    if (!hostName) {
      hostName = _os2["default"].hostname();
    }
  } catch (e) {
    hostName = "";
  }

  return hostName ? hostName.split(".")[0] : null;
};

var getFileContents = function getFileContents(filepath) {

  var contents = null;

  // Return null if the file doesn't exist.
  try {
    var stat = _fs2["default"].statSync(filepath);
    if (!stat || stat.size < 1) {
      return null;
    }
  } catch (e) {
    return null;
  }

  // Try loading the file.
  try {
    contents = _fs2["default"].readFileSync(filepath, "UTF-8");
    // Remove BOM
    contents = contents.replace(/^\uFEFF/, "");
  } catch (e) {
    throw new Error("Config file " + filepath + " cannot be read");
  }

  return contents;
};

var parseContents = function parseContents(raw, filepath) {

  var parsed = undefined;
  var ext = undefined;

  if (filepath) {
    ext = _path2["default"].extname(filepath).substr(1);
  }

  // Parse the file based on extension
  try {

    // Use the built-in parser for .js/.json files
    if (ext === "js" || ext === "json") {
      parsed = require(filepath);
    }

    // YAML is also supported
    if (ext === "yml" || ext === "yaml") {
      parsed = _jsYaml2["default"].safeLoad(raw);
    }

    if (!ext) {
      parsed = JSON.parse(raw);
    }
  } catch (e) {
    throw new Error("Cannot parse config: '" + filepath + "': " + e.message);
  }

  return parsed;
};

var parseConfig = function parseConfig(raw, filepath, name) {

  var config = parseContents(raw, filepath);

  // Keep track of this configuration sources, including empty ones
  if (typeof config === "object") {
    configSources.push({
      name: filepath || name,
      original: raw,
      parsed: config
    });
  }

  return config;
};

var parseFile = function parseFile(filepath) {

  var contents = getFileContents(filepath);

  var parsed = null;

  if (contents) {
    parsed = parseConfig(contents, filepath);
  }

  return parsed;
};

var getFiles = function getFiles(baseNames, extNames) {
  var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

  var configDir = options.configDir;
  var appInstance = options.appInstance;

  var fileGroups = baseNames.map(function (name) {

    var group = [];

    extNames.forEach(function (ext) {
      group.push(_path2["default"].join(configDir, name + "." + ext));
      if (appInstance) {
        group.push(_path2["default"].join(configDir, name + "-" + appInstance + "." + ext));
      }
    });

    return group;
  });

  return _hoek2["default"].flatten(fileGroups);
};

var loadFileConfigs = function loadFileConfigs(baseNames) {
  var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  var config = {};

  var extNames = ["js", "json", "yaml", "yml"];

  var filenames = getFiles(baseNames, extNames, options);

  filenames.forEach(function (filename) {
    var parsed = parseFile(filename);
    if (parsed) {
      _hoek2["default"].merge(config, parsed);
    }
  });

  return config;
};

var loadEnvConfigs = function loadEnvConfigs() {

  var config = {};

  // Override configurations from the $NODE_CONFIG environment variable
  if (process.env.NODE_CONFIG) {
    var envConfig = parseConfig(process.env.NODE_CONFIG, "$NODE_CONFIG");
    if (envConfig) {
      _hoek2["default"].merge(config, envConfig);
    }
  }

  // Override configurations from the --NODE_CONFIG command line
  if (argv.NODE_CONFIG) {
    var cmdLineConfig = parseConfig(argv.NODE_CONFIG, "--NODE_CONFIG argument");
    if (cmdLineConfig) {
      _hoek2["default"].merge(config, cmdLineConfig);
    }
  }

  return config;
};

var loadConfigs = function loadConfigs(configDir) {

  var config = {};

  // Initialize parameters from command line, environment, or default
  var NODE_ENV = initParam("NODE_ENV", "development");
  var APP_INSTANCE = initParam("NODE_APP_INSTANCE");
  var HOST = initParam("HOST");
  var HOSTNAME = initParam("HOSTNAME");
  var CONFIG_DIR = initConfigDir("NODE_CONFIG_DIR", configDir);

  var hostName = getHostName(HOST || HOSTNAME);

  // Read each file in turn
  var baseNames = ["default", NODE_ENV, hostName, hostName + "-" + NODE_ENV, "local", "local-" + NODE_ENV];

  var fileConfig = loadFileConfigs(baseNames, {
    configDir: CONFIG_DIR,
    appInstance: APP_INSTANCE
  });

  if (fileConfig) {
    _hoek2["default"].merge(config, fileConfig);
  }

  _hoek2["default"].merge(config, loadEnvConfigs());

  return config;
};

exports["default"] = loadConfigs;
module.exports = exports["default"];
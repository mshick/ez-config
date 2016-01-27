"use strict";

const path = require("path");
const os = require("os");
const fs = require("fs");
const hoek = require("hoek");
const yaml = require("js-yaml");
const minimist = require("minimist");

const argv = minimist(process.argv.slice(2));
const env = {};
const configSources = [];

const initParam = function (paramName, defaultValue) {

  const value = argv[paramName] || process.env[paramName] || defaultValue;
  env[paramName] = value;
  return value;
};

const initConfigDir = function (paramName, configDir) {

  if (!configDir) {
    configDir = initParam(paramName, path.join(process.cwd(), "config"));
  }

  if (!path.isAbsolute(configDir)) {
    configDir = path.join(process.cwd(), configDir);
  }

  return configDir;
};

const getHostName = function (hostName) {

  // Determine the host name from the OS module, $HOST, or $HOSTNAME
  // Remove any . appendages, and default to null if not set
  try {
    // Store the hostname.
    env.HOSTNAME = hostName;

    if (!hostName) {
      hostName = os.hostname();
    }
  } catch (e) {
    hostName = "";
  }

  return hostName ? hostName.split(".")[0] : null;
};

const getFileContents = function (filepath) {

  let contents = null;

  // Return null if the file doesn't exist.
  try {
    const stat = fs.statSync(filepath);
    if (!stat || stat.size < 1) {
      return null;
    }
  } catch (e) {
    return null;
  }

  // Try loading the file.
  try {
    contents = fs.readFileSync(filepath, "UTF-8");
    // Remove BOM
    contents = contents.replace(/^\uFEFF/, "");
  } catch (e) {
    throw new Error(`Config file ${filepath} cannot be read`);
  }

  return contents;
};

const parseContents = function (raw, filepath) {

  let parsed;
  let ext;

  if (filepath) {
    ext = path.extname(filepath).substr(1);
  }

  // Parse the file based on extension
  try {

    // Use the built-in parser for .js/.json files
    if (ext === "js" || ext === "json") {
      parsed = require(filepath);
    }

    // YAML is also supported
    if (ext === "yml" || ext === "yaml") {
      parsed = yaml.safeLoad(raw);
    }

    if (!ext) {
      parsed = JSON.parse(raw);
    }
  } catch (e) {
    throw new Error(`Cannot parse config: '${filepath}': ${e.message}`);
  }

  return parsed;
};

const parseConfig = function (raw, filepath, name) {

  const config = parseContents(raw, filepath);

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

const parseFile = function (filepath) {

  const contents = getFileContents(filepath);

  let parsed = null;

  if (contents) {
    parsed = parseConfig(contents, filepath);
  }

  return parsed;
};

const getFiles = function (baseNames, extNames, options) {

  options = options || {};
  const configDir = options.configDir;
  const appInstance = options.appInstance;

  const fileGroups = baseNames.map((name) => {

    const group = [];

    extNames.forEach((ext) => {
      group.push(path.join(configDir, `${name}.${ext}`));
      if (appInstance) {
        group.push(path.join(configDir, `${name}-${appInstance}.${ext}`));
      }
    });

    return group;
  });

  return hoek.flatten(fileGroups);
};

const loadFileConfigs = function (baseNames, options) {

  options = options || {};

  const config = {};

  const extNames = [
    "js",
    "json",
    "yaml",
    "yml"
  ];

  const filenames = getFiles(baseNames, extNames, options);

  filenames.forEach((filename) => {
    const parsed = parseFile(filename);
    if (parsed) {
      hoek.merge(config, parsed);
    }
  });

  return config;
};

const loadEnvConfigs = function () {

  const config = {};

  // Override configurations from the $NODE_CONFIG environment variable
  if (process.env.NODE_CONFIG) {
    const envConfig = parseConfig(process.env.NODE_CONFIG, "$NODE_CONFIG");
    if (envConfig) {
      hoek.merge(config, envConfig);
    }
  }

  // Override configurations from the --NODE_CONFIG command line
  if (argv.NODE_CONFIG) {
    const cmdLineConfig = parseConfig(argv.NODE_CONFIG, "--NODE_CONFIG argument");
    if (cmdLineConfig) {
      hoek.merge(config, cmdLineConfig);
    }
  }

  return config;
};

const loadConfigs = function (configDir) {

  const config = {};

  // Initialize parameters from command line, environment, or default
  const NODE_ENV = initParam("NODE_ENV", "development");
  const APP_INSTANCE = initParam("NODE_APP_INSTANCE");
  const HOST = initParam("HOST");
  const HOSTNAME = initParam("HOSTNAME");
  const CONFIG_DIR = initConfigDir("NODE_CONFIG_DIR", configDir);

  const hostName = getHostName(HOST || HOSTNAME);

  // Read each file in turn
  const baseNames = [
    "default",
    NODE_ENV,
    hostName,
    `${hostName}-${NODE_ENV}`,
    "local",
    `local-${NODE_ENV}`
  ];

  const fileConfig = loadFileConfigs(baseNames, {
    configDir: CONFIG_DIR,
    appInstance: APP_INSTANCE
  });

  if (fileConfig) {
    hoek.merge(config, fileConfig);
  }

  hoek.merge(config, loadEnvConfigs());

  return config;
};

module.exports = loadConfigs;

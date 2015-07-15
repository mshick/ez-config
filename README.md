EZ Config ![npm release](https://img.shields.io/npm/v/ez-config.svg?style=flat)
=========

A simple configuration file loader for node.js following some of the basic 
style of [node-config](https://github.com/lorenwest/node-config), but with a 
focus on simplicity. It supports `js`, `json`, and `yaml` configuration files,
as well as environmental overrides.

## Installation

```sh
$ npm install ez-config --save
```

## Basic usage

Create a `config` directory at the root of your app and place a `default.json` 
with the following contents:

```json
{
  "demo": {
    "rad": "cool"
  }
}
```

Then do this:

```js
var config = require("ez-config");
config.get();
// { "demo": { "rad": "cool" } }
config.get("demo.rad");
// "cool"
```

## Advanced use

* Obeys the import hierarchy described [here](https://github.com/lorenwest/node-config/wiki/Configuration-Files).  
* Allows setting the `NODE_CONFIG_DIR` environment variable to something other 
than `config`.
* Allows an environmental override via JSON string, e.g. `NODE_CONFIG='{"demo":"foo"}' node app.js`
* Allows a command-line override via JSON string, e.g. `node app.js --NODE_CONFIG='{"demo":"foo"}'`

## Tests

I'm checking basic functionality, but coverage is currently disabled due to
ES6 limitations in [Lab](https://github.com/hapijs/lab).

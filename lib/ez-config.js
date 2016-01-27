"use strict";

const hoek = require("hoek");
const loadConfigs = require("./load-configs");

class EzConfig {

  constructor() {
    this.loadDir();
  }

  loadDir(dirname) {
    this.values = loadConfigs(dirname);
  }

  get(prop) {

    let val;

    if (!prop) {
      val = hoek.clone(this.values);
    } else {
      val = hoek.clone(hoek.reach(this.values, prop));
    }

    return val;
  }
}

module.exports = EzConfig;

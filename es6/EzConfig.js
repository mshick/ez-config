import hoek from "hoek";
import loadConfigs from "./loadConfigs";


class EzConfig {

  constructor() {
    this.values = loadConfigs();
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

export default EzConfig;

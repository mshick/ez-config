var code = require("code");
var lab = require("lab").script();
var EzConfig = require("../lib/ez-config");

var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var expect = code.expect;


describe("config", function () {

  before(function (done) {
    process.env.NODE_CONFIG_DIR = "./test/fixtures/config";
    done();
  });

  it("loads all configs", function (done) {

    var config = require("../lib");

    // Is it a proper config?
    expect(config).to.be.an.instanceof(EzConfig);

    // Is there a config values object?
    expect(config.get()).to.be.an.object();

    // Ensure that `local.json` trumps all
    expect(config.get("overwritten")).to.equal("baz");

    // Test a nested prop from each config fixture
    expect(config.get("default.nested1")).to.equal("abc");
    expect(config.get("test.nested1")).to.equal("abc");
    expect(config.get("local.nested1")).to.equal("abc");

    done();
  });

  it("allows env config to trump all files", function (done) {

    var envVal = "env";
    process.env.NODE_CONFIG = JSON.stringify({ "overwritten": envVal });

    var config = new EzConfig();
    expect(config.get("overwritten")).to.equal(envVal);

    done();
  });


  it("can also switch the config dir via a method", function (done) {

    var config = require("../lib");
    config.loadDir("./test/fixtures/config-loaddir");
    expect(config.get("default.nested1")).to.equal("abc");
    done();
  });
});

module.exports.lab = lab;

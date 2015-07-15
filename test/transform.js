var babel = require("babel");

module.exports = [{
  ext: ".js",
  transform: function (content, filename) {

    // Make sure to only transform your code or the dependencies you want
    if (filename.indexOf("node_modules") === -1) {
      var result = babel.transform(content, {
        sourceMap: "inline",
        filename: filename,
        sourceFileName: filename
      });
      return result.code;
    }

    return content;
  }
}];

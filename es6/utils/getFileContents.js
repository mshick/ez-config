import fs from "fs";

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

export default getFileContents;

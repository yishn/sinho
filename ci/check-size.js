import zlib from "node:zlib";
import fs from "node:fs";

const content = fs.readFileSync("./dist/bundle.min.js");
const gzip = zlib.gzipSync(content);

console.log(gzip.byteLength);

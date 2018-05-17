const uglify = require('uglify-js');
let raw = `
if(false) {
    console.log(1);
    if(false) {
      console.log(2);
    } else {
      console.log('here');
    }
} else if(true) {
    console.log(2);
    if(false) {
      console.log(2);
    } else {
      console.log('here');
    }
}
`;
let transformed = uglify.minify(raw, {sourceMap: null, mangle: null, compress: {sequences: false, dead_code: true}, output: {beautify: true}}).code;
transformed = transformed.replace(/;[\r\n]{2}/g, ';\n');
console.log(transformed);

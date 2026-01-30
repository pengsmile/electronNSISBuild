const argv = require('minimist')(process.argv.slice(2))._;
const fs = require('fs');
let stdout = `module.exports={isDev:${argv[0]==='dev'?'true':'false'},packDev:${argv[1]==='pack'?'false':'true'}}`;
console.log('Switch electron env to '+argv[0]+' and packDev is ' + argv[1])
fs.writeFileSync('public/electronEnv.js',stdout)

const os = require('os');

//get the current user info from os module
const user = os.userInfo();
console.log(user);
//check the system uptime
console.log(`the system has been active for ${os.uptime()} seconds`);
const currentOS = {
    name: os.type(),
    version: os.version(),
    totalMem: os.totalmem(),
    freeMem: os.freemem()
};
console.log(currentOS);

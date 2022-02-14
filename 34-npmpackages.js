//npm 
//sharable JS code: Package/module/dependency
//No quality control

//security && usefulness of package: weekly download

//npm - global command, comes with node
//npm --version

//local dependency  - use it only in this particular project
//npm i <packageName>

//global dependency - use it in any project
//npm install -g <packageName>
//sudo npm install -g <packageName> (mac)

//package.json - manifest file (stores important info about project/package)
// manual approach (create package.json in the root, create properties etc)
// npm init (step by step, press enter to skip)
// npm init -y (everything default)

import _ from 'lodash';

const items = [1,[2,[3,[4]]]];

const newItems = _.flattenDeep(items);
console.log(newItems);
console.log("Hello Hemant Singh Jadon");

// dev dependency , use command: npm i <package-name> -D
/* something that might be used by developer to develop 
the app, but not used in production (something better can be used in prod)
ex - nodemon (for restarting the app), testing, linting, formatting etc.
*/

/// Scripts

//to run a scripted command : npm run <script-name> 
// for some scripts, shortcut can be used (skip run) > npm <command key name>

//UNINSTALLING PACKAGES

// uninstalling a specific package: 
//Approach 1: npm uninstall <package-name>
//Approach 2: remove the package from package.json file directly

//uninstalling everything:
//step 1: delete node_modules folder > Step 2: delete package-lock.json file
//everything can be installed back using:  npm i


//INSTALLING DEPEDENCY GLOBALLY

// for mac: sudo npm i -g <package-name>
// run like global: npx 
//Variables, scope and hoisting

/* Var keyword is function-scoped
while let, const keywords are block-scoped. 
*/ 

/* var keyword understand function-having a different scope
but not block/loops
*/

//1. Example showing that variables declared with 'var' are not block-scoped.

var x = 10;
if(true){
    var x = 20;
    console.log(x);
}
console.log(x);
/* the first x declared with var has a global scope. 
inside the if block > the 2nd declaration x with var actually
declares and initialises the previous x variable again, since both of them have
same scope(global, x inside the block does not recognise a new scope). 
since, var keyword allow redeclaration of the same variable in same scope, this does not throw any error.
so the new value of x in the global scope becomes 20. 
so both console.log statements with output 20.
*/


//2. Example showing that variables declared with keyword 'var' are function-scoped.

var species = "human";

function transform(){
    var species = "Warewolf";
    console.log(species);
}
console.log(species);
transform();

/* the first 'species' variable declared with 'var' has a global scope .
then second 'species' variable inside the transform() function identifies a new scope.
so this seconds declaration makes a new species variable in the scope of transform() function
rather than redeclaring the one in global scope. 
the console.log statement before the calling of transform func output the value of global 'species' variable > human
the execution of transform() function > the console.log statement inside the function output local 'species' variable > warewolf
*/

//3. Variable hoisting in JS and related issues with 'var' keyword

/* hoisting is a behaviour in JS in which variable and function declaration are moved to
the top of their scope. Only function declarations are moved, not the initialisation. 
*/

/* variables declared with 'var' are assigned as undefined by default */
var hemant;
console.log(hemant);

//code we write

console.log(z);
var z = 20;

/* due to hoisting, JS moves the declaration to the top meaning the code executes 
something like this. 
var z; //initialised as undefined by default due to 'var' keyword
console.log(z); //outputs undefined
z = 20;
*/

function DemoHoistingIssue(){
    // variable y initialised in the outer func scope.
    var y = 100;
    function hoist(){
        //the code inside this if block is never executed because of false.
        if(false){
            var y = 200;
        }
        //this would check if there is any variable y in the local function scope. if not found,
        //then would look in outer scope
        console.log(`the value of variable y is ${y}`);
    }
    hoist();
}
DemoHoistingIssue();

/* due to hoisting, inside the function hoist, the declaration of
variable y is moved to the top of the scope, even-though it's inside the block (since it's declared with keyword 'var', it's not block scoped).
the code of func hoist executed something like this:
function hoist(){
    var y; // declared with default value as undefined
    if(false){
        y = 200;
    }
    console.log(y); //outputs undefined
}
*/

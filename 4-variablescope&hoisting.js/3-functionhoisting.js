//Hoisting functions

/* 1. function declarations
2. function expressions
*/


//1. Function declaration
hoisted();

function hoisted(){
    console.log("this function has been hoisted.");
}
/* the above declaration will be hoisted and 
therefore, JS allows us to invoke the function even 
before it is explicitly declared in the code
*/

//2. Function expression
expression();// Outputs: "TypeError: expression is not a function."
var expression = function(){
    console.log("Will this work?");
}

/* it will not allow to invoke this function assigned to
a varible through expression  before
it is explicitly assigned */

/* the above code > variable declaration is considered
variable assignment is only understood only during execution. 
So JS will hoist the variable declaration but only during 
execution of this code line will know that this variable
is asssigned to a function expression.*/

//3. Mixing function declaration with expression

expressionWithDeclaration(); // Outputs: type error
/* only variable declaration is hoisted to the top */
/*it's assignment to the function is not hoisted.
therefore, the interpreter throws a type error. */


var expressionWithDeclaration = function hoisting(){
    console.log("this is pure work.");
}
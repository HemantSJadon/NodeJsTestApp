//JS classes
//1. Named classes/ class declaration

class Hobbit{
    constructor(height, weight){
        this.height = height;
        this.weight = weight;
    }
}

var Frodo = new Hobbit();
Frodo.height = 100;
Frodo.weight = 200;
console.log(Frodo);

//2. Anonymous classes/ class expressions
var square = new polygon();
square.height = 10;
square.weight = 10;
console.log(square);


var polygon = class {
    constructor(height, weight){
        this.height = height;
        this.weight = weight;
    }
}


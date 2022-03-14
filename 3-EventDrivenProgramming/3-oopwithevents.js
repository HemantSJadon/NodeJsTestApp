//Object oriented programming and Event-driven programming
import EventEmittor from 'events';
import { threadId } from 'worker_threads';

/* all behaviour of an individual object be handled from 
code within that unit. Applications are built with many such
different units that all speak to and interact with each other.
*/

/* to trigger a function, the source object needs to reach 
inside the object where behaviour/function is defined. 

The event-driven programming changes the way objects communicate to each other. 
The source object just emits an event. 
All the event listeners handle the event the way they have been told to
*/

/* but on thing to note: 
When a function defined inside a class is trigged using event, 
the context in which the function is being executed is the EventEmttior, not the object of this class.
meaning , if we had used 'this' keyword inside the function > it will reference the event emittor object, not the class object.
so class properties access inside function will return undefined 
this can cause runtime errors.
*/

// Object oriented programming

//The process of eating for an alligator

const myGatorEvents = new EventEmittor();
class Food{
    constructor(name, eventEmittors){
        this.name = name;
        this.eventEmittors = eventEmittors;
        eventEmittors
        .find(e => (Object.prototype.toString.call(e)))
        .on('gatorEat',this.becomeEatenEventHandler);
    }
    becomeEatenEventHandler(food){
        Food.prototype.becomeEaten.call(food);
    }
    becomeEaten(){
        this.isEaten = true;
        console.log(`this ${this.name} is eaten.`);
    }
}

var bacon = new Food('bacon', [myGatorEvents]);

class gator{
    constructor(eventEmittor,food){
        this.eventEmittor = eventEmittor;
        this.food = food;
    }
    eat(){
        //This method/class will need to be modified
        //if there is some thing new we want to happend
        //when gator eats
        this.food.becomeEaten();
    }
    eatEvent()
    {
        this.eventEmittor.emit('gatorEat',this.food);
    }
}

var gatorObj = new gator(myGatorEvents,bacon);
console.log("gator eat event");
gatorObj.eatEvent();
console.log("gator eat without event")
gatorObj.eat();
/* callback hell
callbacks are functions passed to other function. 
this other function can invoke the passed function. 
*/

function clickButton (cb){
    cb();
};

clickButton(function() {
    setTimeout(() => {
        console.log("red patakha");
        setTimeout(() => {
            console.log("blue patakha");
            setTimeout(() => {
                console.log("green patakha");
            }, 2000);
        }, 3000);
    }, 1000);
    
});

//JS -promises example

//.first = red patakha
//.second = blue patakha
//.third = green patakha

//In sequence

const elements = ['.first','.second','.third'];
function clickButton(cb){
    cb();
}

clickButton(() => {
    addColor(1000,'.first','red')
    .then(() => addColor(3000,'.second','blue'))
    .then(() => {
        console.log('Hello world');
        addColor(2000,'.third','green');
    })
    .catch((err) => console.log(err));
})

function addColor(time,selector,color){
    const element = elements.find(e => e === selector);
    return new Promise((resolve, reject) => {
        if(element !== undefined){
            setTimeout(() => {
                console.log(`${color} patakha`);
                resolve();
            }, time);
        } else{
            reject('No such element found.');
        }
    });
}


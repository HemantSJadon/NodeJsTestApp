//optional chaining

const people = [
    {
        name : 'bob',
        location: {street: '123 main street',
        timezone: {offset: '+7:00'}},
    },
    {
        name: 'peter',
        location: {
            street: '123 pine street'
        }
    },
    {
        name: 'susan',
        location:{
            street: '123 Apple street',
            timezone:{
                offset: '+9:00'
            }
        }
    }
    
]
people.forEach(p => {
    console.log(p.location && 
        p.location.timezone && p.location.timezone.street);
});

people.forEach(p => {
    console.log(p?.location?.timezone?.offset || 'hello world');
});


console.log(true  && 'hello world hemant');
console.log(false || 'hello world');
console.log(false && 'hello world hemant');
import fetch from 'node-fetch';

//reduce - objects

//cart examples

const cart = [
    {
        title:"samsung",
        price: 40.56,
        amount: 2
    },
    {
        title: "apple",
        price: 60.14,
        amount: 3
    },
    {
        title: "nokia",
        price: 10.98,
        amount: 4
    },
    {
        title: "huawei",
        price: 20.04,
        amount: 5
    }
];

let {totalItems, totalCost} = cart.reduce((total, cartItem) => {
    const {amount, price} = cartItem;
    total.totalItems += amount;
    total.totalCost += amount * price;
    console.log(total.totalItems);
    console.log(total.totalCost);
    return total;
},{
    totalItems: 0,
    totalCost: 0
});
totalCost = parseFloat(totalCost.toFixed(2));
console.log(totalItems,totalCost);

///node fetch example

//fetching text or web-pages

// fetch('https://google.com')
// .then(res => res.text())
// .then(txt => console.log(txt));

// fetching JSON data from Rest API

// fetch('https://jsonplaceholder.typicode.com/users')
// .then(res => res.json())
// .then(json => {
//     console.log("First user in the array:");
//     console.log(json[0]);
//     console.log("Name of the first user in the array:");
//     console.log(json[0].name);
// })
// fetch("https://jsonplaceholder.typicode.com/posts")
// .then(res => res.json())
// .then(json => console.log(json));

//sending post requests using node-fetch

// fetch("https://jsonplaceholder.typicode.com/posts",{
//     method: 'POST',
//     body: JSON.stringify(
//         {
//             title:'foo',
//             body: 'bar',
//             userId: 1
//         }
//     ),
//     header:{
//         'Content-type': 'application/json; charset=UTF-8',
//     }
// }).then(res => res.json())
// .then(json => console.log(json));

//updating a resource

// const postsURL = "https://jsonplaceholder.typicode.com/posts";
// fetch(`${postsURL}/1`)
// .then(res => res.json())
// .then(json => console.log(json));

// fetch(`${postsURL}/1`,{
//     method: 'PUT',
//     body: JSON.stringify(
//         {
//             id: 1,
//             title:'foo',
//             body:'bar',
//             userId:1
//         }
//     ),
//     headers: {
//         'Content-type':'application/json; charset=UTF-8',
//     }
// }).then(res => res.json())
// .then(json => console.log("updated values",json));

// fetch(`${postsURL}/1`)
// .then(res => res.json())
// .then(json => console.log(json));


//github repo example

const url = 'https://api.github.com/users/john-smilga/repos?per_page=100';

const fetchRepos = async () => {
    const response = await fetch(url);
    const data = (await response.json());
    const newData = data.reduce((total,repo) =>{
        const {language} = repo;
        if(language)
        {
            total[language] = total[language]+1 || 1;
        }
        return total;
    },{})
    console.log(newData);
}
 fetchRepos();


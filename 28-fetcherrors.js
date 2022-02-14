//Fetch errors
//only throws an error if it cannot resolve (network error)
//error response (4xx/5xx) are still considered a response
//therefore not reflected in catch(err) statement

import fetch from 'node-fetch';

const url = "https://jsonplaceholder.typicode.com/ussers/1";

// console.log(fetch(url).then(res => res.json()));

const getTours = async(url) => {

    try {
        const resp = await fetch(url);
        if(!resp.ok){
            const msg = `There was an error "${resp.status} ${resp.statusText}"`;
            throw new Error(msg);
        }
        const tours = await resp.json();
        console.log(tours);
    } catch (error) {
        console.log(error);
    }
}
await getTours(url);

// fetch("https://jsonplaceholder.typicode.com/users/1")
// .then(res => res.json())
// .then(json => console.log(json))
// .catch(err => console.log(err));

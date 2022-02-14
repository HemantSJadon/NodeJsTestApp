//top level await 
import fetch from 'node-fetch';

const resp = await fetch('https://jsonplaceholder.typicode.com/users/1');
const data = await resp.json();

console.log(data);

//
import fetchTabls from './30-fetchtabs.js';
const data2 = await fetchTabls();
console.log(data2);

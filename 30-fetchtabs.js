import fetch from 'node-fetch';

const fetchTabs = () => {
    return fetch('https://jsonplaceholder.typicode.com/users/2')
    .then(resp => resp.json());
}

export default fetchTabs;
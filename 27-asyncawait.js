//JS nuggets - async /await
/* async must be present, always returns a promise
await waits till promise is settled
erropr handling - try/catch block
*/
//no need of chaining .then/.catch blocks

// const example = async () => {
//     return "hello world";
// };
// async function someFunc() {
//     const result = await example();
//     return result;
// }

// console.log(someFunc());
// // console.log(example());


const users = [
    {id: 1, name: 'hemant'},
    {id: 2, name: 'kancha'},
    {id: 3, name: 'vidisha'},
    {id: 4, name: 'tarun'}
];
const articles = [
    {userId:1,articles:['one','two','three']},
    {userId:2,articles:['four','five']},
    {userId:3,articles:['six','seven','eight']}
];

async function getArticlesForUser (userName) {
    try {
        const user = await getUser(userName);
        const articles = await getArticles(user?.id || undefined);
        return articles;
    } catch (error) {
        console.log(error);
    }
}
console.log(await getArticlesForUser('tarun'));

// const articlesForVidisha = 
// getUser('vidisha')
// .then(user => getArticles(user.id))
// .then(articles => console.log(articles))
// .catch(err => console.log(err));

// console.log(articlesForVidisha);

async function getUser(name){
    const user = users.find(u => u.name === name);
    return user;
}
async function getArticles(userId){
    const userArticles = articles.find(a => a.userId === userId);
    if(userArticles){
        return userArticles.articles;
    }
    else{
        return undefined;
    }
}
// function getUser(name){
//     return new Promise((resolve,reject) => {
//         const user = users.find((user) => user.name === name);
//         if(user){
//             return resolve(user);
//         }
//         else{
//             reject(`No such user with name: ${name}`);
//         }
//     });
// }

// function getArticles(userId){
//     return new Promise((resolve, reject) => {
//         const article = articles.find((a) => a.userId === userId);
//         if(article){
//             return resolve(article.articles);
//         }
//         else {
//             reject(`No articles found for userId:${userId}`);
//         }
//     });
// }
//unique values usning set
const menu = [
    {
        name:"sandwich",
        category: "breakfast"
    },
    {
        name:"dailya",
        category: "breakfast"
    },
    {
        name:"poha",
        category: "breakfast"
    },
    {
        name:"dalroti",
        category: "dinner"
    },
    {
        name:"sagroti",
        category: "lunch"
    },
    {
        name:"paneersabji",
        category: "lunch"
    }
]

const categories = ['all',...new Set(menu.map((i) => i.category))];
console.log(categories);
const fs = require('fs');
let content = fs.readFileSync('src/data/menuTemplates.ts', 'utf-8');

const fixes = {
    // === ACOMPANHAMENTOS (Wrong Content) ===
    "Batata com Cheddar e Bacon": "https://images.unsplash.com/photo-1593001874117-c99c800e3eb7?auto=format&fit=crop&q=80&w=800", // loaded fries
    "Purê de Batata": "https://images.unsplash.com/photo-1620067644265-b7df29d6d5eb?auto=format&fit=crop&q=80&w=800", // mashed potatoes
    "Nuggets de Frango": "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&q=80&w=800", // chicken nuggets

    // === BEBIDAS (Wrong Content) ===
    "Água Mineral 500ml": "https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&q=80&w=800", // bottle of water
    "Suco Natural de Laranja": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800", // orange juice glass
    "Suco Natural de Limão": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800", // lemonade
    "Suco Natural de Maracujá": "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&q=80&w=800", // yellow passion fruit juice
    "Café Expresso": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800", // espresso shot

    // === JAPONESA (Wrong Content) ===
    "Hot Roll": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=800", // fried sushi roll
    "Uramaki Hot": "https://images.unsplash.com/photo-1559410545-0bdcd187e0a6?auto=format&fit=crop&q=80&w=800", // fried sushi roll 
    "Sashimi de Salmão": "https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&q=80&w=800", // sashimi slices
    "Niguiri de Salmão": "https://images.unsplash.com/photo-1615361200141-f45040f367be?auto=format&fit=crop&q=80&w=800", // salmon on rice
    "Gunkan de Salmão": "https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?auto=format&fit=crop&q=80&w=800", // gunkan maki

    // === MASSAS (Wrong Content) ===
    "Talharim ao Alho e Óleo": "https://images.unsplash.com/photo-1556761223-4c4282c73f77?auto=format&fit=crop&q=80&w=800", // spaghetti garlic oil

    // === PIZZAS (Wrong Content) ===
    "Strogonoff": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800", // just a pizza, since strogonoff pizza is hard to find

    // === TRADICIONAIS (Wrong Content) ===
    "Filé de Peixe Grelhado": "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=800", // grilled white fish

    // === HAMBÚRGUERES (Wrong Content - Lanches Diversos shown as wraps mostly) ===
    "Bauru": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=800", // sandwich
    "Misto Quente": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=800", // grilled cheese
    "Crepe de Frango": "https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&q=80&w=800", // crepe
    "Crepe de Chocolate": "https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&q=80&w=800", // sweet crepe
    "Bolinha de Queijo": "https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?auto=format&fit=crop&q=80&w=800", // cheese balls/bites
    "Quibe Frito": "https://images.unsplash.com/photo-1598515322645-31b32d0cbbcf?auto=format&fit=crop&q=80&w=800", // kibbeh/kofte

    // === SOBREMESAS ===
    "Torta de Morango": "https://images.unsplash.com/photo-1505253818621-081e6490bbfa?auto=format&fit=crop&q=80&w=800", // strawberry tart/cake
};

let replacements = 0;
for (const [name, url] of Object.entries(fixes)) {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(
        `(name:\\s*"${escapedName}",\\s*description:\\s*"[^"]*",\\s*price:\\s*[\\d.]+,\\s*image_url:\\s*")([^"]*)(")`,
        'g'
    );

    const newContent = content.replace(regex, `$1${url}$3`);
    if (newContent !== content) {
        replacements++;
        content = newContent;
    }
}

fs.writeFileSync('src/data/menuTemplates.ts', content, 'utf-8');
console.log(`Done! Fixed images for ${replacements} specific products (batch 2).`);

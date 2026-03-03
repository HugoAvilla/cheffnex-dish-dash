const fs = require('fs');
let content = fs.readFileSync('src/data/menuTemplates.ts', 'utf-8');

const categoryImages = {
    hamburgueres: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800',
    pizzas: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800',
    pasteis: 'https://images.unsplash.com/photo-1644062484666-4c4c81062b8d?auto=format&fit=crop&q=80&w=800',
    japonesa: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=800',
    massas: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&q=80&w=800',
    tradicionais: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=800',
    sobremesas: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=800',
    bebidas: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800',
    acompanhamentos: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&q=80&w=800',
    'lanches-diversos': 'https://images.unsplash.com/photo-1599813292102-3fb622384a3c?auto=format&fit=crop&q=80&w=800'
};

for (const [cat, img] of Object.entries(categoryImages)) {
    const regex = new RegExp(`(id:\\s*["']${cat}["'][\\s\\S]*?products:\\s*\\[)([\\s\\S]*?)(\\])`, 'g');
    content = content.replace(regex, (m, start, prods, end) => {
        let newProds = prods.replace(/price:\s*([\d\.]+)(\s*\})/g, `price: $1, image_url: "${img}"$2`);
        return start + newProds + end;
    });
}
fs.writeFileSync('src/data/menuTemplates.ts', content);
console.log('Done replacement');

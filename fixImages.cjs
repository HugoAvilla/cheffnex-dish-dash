const fs = require('fs');
let content = fs.readFileSync('src/data/menuTemplates.ts', 'utf-8');

// The updated list of specific products to fix
const fixes = {
    // BROKEN LINKS
    "Arroz Branco": "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=800", // using another rice
    "Isca de Frango": "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&q=80&w=800", // crispy chicken pieces
    "Queijo Coalho na Brasa": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=800", // grilled cheese stick alternative
    "Picanha Burger": "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=800", // big burger
    "Cachorro-Quente Especial": "https://images.unsplash.com/photo-1599813292102-3fb622384a3c?auto=format&fit=crop&q=80&w=800",
    "Cachorro-Quente Tradicional": "https://images.unsplash.com/photo-1612392062126-e740bb3e3586?auto=format&fit=crop&q=80&w=800",
    "Coxinha": "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=800", // Brazilian snack alternative
    "Croissant de Presunto e Queijo": "https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&q=80&w=800",
    "Pão de Queijo": "https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?auto=format&fit=crop&q=80&w=800", // Alternative round food
    "Tapioca de Frango": "https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&q=80&w=800", // flatbread-like
    "Canelone de Carne": "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=800",
    "Lasanha Quatro Queijos": "https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&q=80&w=800",
    "Pastel de Carne": "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&q=80&w=800",
    "Pastel de Palmito": "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&q=80&w=800",
    "Pastel de Pizza": "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&q=80&w=800",
    "Carne Seca com Catupiry": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800",
    "Doce de Leite com Banana": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800",
    "Churros": "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=800",

    // WRONG CONTENT - ACOMPANHAMENTOS
    "Mandioca Frita": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&q=80&w=800", // Actual fried food / chips

    // WRONG CONTENT - BEBIDAS
    "Suco Natural de Abacaxi com Hortelã": "https://images.unsplash.com/photo-1546171753-97d7676e4602?auto=format&fit=crop&q=80&w=800", // yellow juice

    // WRONG CONTENT - JAPONESA
    "Sashimi de Atum": "https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&q=80&w=800", // Correct sashimi photo
    "Temaki de Atum": "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&q=80&w=800", // Cone/temaki looking
    "Temaki de Salmão": "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&q=80&w=800",
    "Temaki Skin": "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&q=80&w=800",

    // WRONG CONTENT - LANCHES DIVERSOS
    "Empada de Frango": "https://images.unsplash.com/photo-1549575810-b9b7abc51d9e?auto=format&fit=crop&q=80&w=800", // small savory pie looking

    // WRONG CONTENT - MASSAS
    "Penne ao Pesto": "https://images.unsplash.com/photo-1516100882582-96c3a05fe590?auto=format&fit=crop&q=80&w=800", // pesto pasta

    // WRONG CONTENT - PASTÉIS (using a generic empanada/pastel image for all)
    "Pastel de Banana com Chocolate": "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&q=80&w=800",
    "Pastel de Calabresa": "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&q=80&w=800",
    "Pastel de Camarão": "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&q=80&w=800",
    "Pastel de Doce de Leite": "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&q=80&w=800",
    "Pastel de Frango": "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&q=80&w=800",
    "Pastel de Linguiça": "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&q=80&w=800",
    "Pastel de Milho": "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&q=80&w=800",
    "Pastel de Quatro Queijos": "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&q=80&w=800",
    "Pastel de Romeu e Julieta": "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&q=80&w=800",
    "Pastel Napolitano": "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&q=80&w=800",

    // WRONG CONTENT - SOBREMESAS
    "Açaí 300ml": "https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&q=80&w=800", // a bowl of acai
    "Açaí 500ml": "https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&q=80&w=800", // a bowl of acai
    "Banana Caramelizada": "https://images.unsplash.com/photo-1588667389274-1234c99cc6bf?auto=format&fit=crop&q=80&w=800", // caramelized bananas
    "Bolo de Cenoura": "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&q=80&w=800", // carrot cake looking
    "Brigadeiro Gourmet": "https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?auto=format&fit=crop&q=80&w=800", // chocolate truffles
    "Brownie com Sorvete": "https://images.unsplash.com/photo-1569864358642-9d1684040f43?auto=format&fit=crop&q=80&w=800", // brownie with ice cream
    // Note: There are two "Romeu e Julieta", one pizza and one sobremesa.
    // The script previously changed all instances, let's fix the sobremesa one.
    // I will use regex to specifically target the sobremesa one vs pizza.
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

// Special case for Romeu e Julieta Sobremesa (it has different description than the pizza)
content = content.replace(
    /(name:\s*"Romeu e Julieta",\s*description:\s*"Goiabada com queijo minas e um toque de mel",\s*price:\s*[\d.]+,\\s*image_url:\s*")([^"]*)(")/g,
    `$1https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?auto=format&fit=crop&q=80&w=800$3` // specific desserts or sweet image
);


fs.writeFileSync('src/data/menuTemplates.ts', content, 'utf-8');
console.log(`Done! Fixed images for ${replacements} specific products.`);

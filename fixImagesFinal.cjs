const fs = require('fs');
let content = fs.readFileSync('src/data/menuTemplates.ts', 'utf-8');

const fixes = {
    // === HAMBÚRGUERES ===
    "Picanha Burger": "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&q=80&w=800", // different big burger (used costela image but different) -> wait, let's use a unique one

    // === PIZZAS ===
    "Pepperoni": "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&q=80&w=800", // actual pepperoni pizza
    "Strogonoff": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800", // rustic pizza
    "Carne Seca com Catupiry": "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&q=80&w=800", // chicken catupiry alike
    "Doce de Leite com Banana": "https://images.unsplash.com/photo-1564936281291-2945514f7b60?auto=format&fit=crop&q=80&w=800", // dessert looking pizza/tart
    "Romeu e Julieta": "https://images.unsplash.com/photo-1564936281291-2945514f7b60?auto=format&fit=crop&q=80&w=800", // Note: I must be careful with Pizza vs Sobremesa again. I'll use regex for Pizza Romeu.

    // === PASTÉIS ===
    // Giving a few different empanada/pastel images to vary them
    "Pastel de Queijo": "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=800", // coxinha/snack style
    "Pastel de Camarão": "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=800",
    "Pastel de Palmito": "https://images.unsplash.com/photo-1509482560494-4126f8225994?auto=format&fit=crop&q=80&w=800", // different snack look
    "Pastel Napolitano": "https://images.unsplash.com/photo-1509482560494-4126f8225994?auto=format&fit=crop&q=80&w=800",
    "Pastel de Calabresa": "https://images.unsplash.com/photo-1584278860047-22db9ff82bed?auto=format&fit=crop&q=80&w=800", // bacalhau style
    "Pastel de Quatro Queijos": "https://images.unsplash.com/photo-1584278860047-22db9ff82bed?auto=format&fit=crop&q=80&w=800",
    "Pastel de Banana com Chocolate": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80&w=800", // sweet snack look
    "Pastel de Romeu e Julieta": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80&w=800",
    "Pastel de Milho": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80&w=800",

    // === JAPONESA ===
    "Sashimi de Salmão": "https://images.unsplash.com/photo-1583623025817-d180a2221d0a?auto=format&fit=crop&q=80&w=800", // Real sashimi
    "Sashimi de Atum": "https://images.unsplash.com/photo-1583623025817-d180a2221d0a?auto=format&fit=crop&q=80&w=800",
    "Temaki de Salmão": "https://images.unsplash.com/photo-1607246944355-635b71908ef9?auto=format&fit=crop&q=80&w=800", // Real temaki
    "Temaki de Atum": "https://images.unsplash.com/photo-1607246944355-635b71908ef9?auto=format&fit=crop&q=80&w=800",
    "Temaki Skin": "https://images.unsplash.com/photo-1607246944355-635b71908ef9?auto=format&fit=crop&q=80&w=800",
    "Hot Roll": "https://images.unsplash.com/photo-1559410545-0bdcd187e0a6?auto=format&fit=crop&q=80&w=800", // fried roll

    // === MASSAS ===
    "Lasanha Quatro Queijos": "https://images.unsplash.com/photo-1614961233913-a5113a4a34ed?auto=format&fit=crop&q=80&w=800", // lasagna
    "Nhoque ao Sugo": "https://images.unsplash.com/photo-1598866594230-a7c12756260f?auto=format&fit=crop&q=80&w=800", // gnocchi/nhoque

    // === TRADICIONAIS ===
    "Feijoada Completa": "https://images.unsplash.com/photo-1610440042657-612c34d9b4b4?auto=format&fit=crop&q=80&w=800", // real feijoada/bean stew
    "Strogonoff de Carne": "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&q=80&w=800", // real strogonoff (copy frango)
    "Baião de Dois": "https://images.unsplash.com/photo-1644053805377-6f0db5bdf4b4?auto=format&fit=crop&q=80&w=800", // rice and beans mixed
    "Galinhada Caipira": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80&w=800", // Wait, 1604 is pastel!

    // === BEBIDAS ===
    "Sprite 350ml": "https://images.unsplash.com/photo-1629858632641-7e8db745a31a?auto=format&fit=crop&q=80&w=800", // soda can green

    // === LANCHES DIVERSOS ===
    "Tapioca de Carne Seca": "https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&q=80&w=800", // tapioca
    "Bauru": "https://images.unsplash.com/photo-1619096252214-ef06c45683e3?auto=format&fit=crop&q=80&w=800", // sandwich/bauru
};

// Override some fixes directly in the dictionary to avoid duplicates
fixes["Picanha Burger"] = "https://images.unsplash.com/photo-1586816001966-79b736744398?auto=format&fit=crop&q=80&w=800"; // duplo cheddar image
fixes["Galinhada Caipira"] = "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=800"; // rice dish
fixes["Tutu de Feijão"] = "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=800"; // tropeiro image

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

// Special cases for Romeu e Julieta (Pizza)
content = content.replace(
    /(name:\s*"Romeu e Julieta",\s*description:\s*"Pizza doce com goiabada e queijo minas derretido",\s*price:\s*[\d.]+,\\s*image_url:\s*")([^"]*)(")/g,
    `$1https://images.unsplash.com/photo-1564936281291-2945514f7b60?auto=format&fit=crop&q=80&w=800$3`
);


fs.writeFileSync('src/data/menuTemplates.ts', content, 'utf-8');
console.log(`Done! Fixed images for ${replacements} specific products (final cross-contamination batch).`);

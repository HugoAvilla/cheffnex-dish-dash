const fs = require('fs');

let content = fs.readFileSync('src/data/menuTemplates.ts', 'utf-8');

const interface_str = `export interface TemplateExtra {
  name: string;
  price: number;
}

export interface TemplateProduct {
  name: string;
  description: string;
  price: number;
  extras?: TemplateExtra[];
  crossSell?: string[]; // category IDs, e.g. ['bebidas', 'acompanhamentos']
}`;

content = content.replace(`export interface TemplateProduct {
  name: string;
  description: string;
  price: number;
}`, interface_str);

content = content.replace(`export interface MenuTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  products: TemplateProduct[];
}`, `export interface MenuTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  crossSell?: string[];
  extras?: TemplateExtra[];
  products: TemplateProduct[];
}`);

const replacements = [
    {
        search: `id: "hamburgueres",
    name: "Hambúrgueres",
    icon: "🍔",
    description: "Hambúrgueres artesanais, smash burgers e sanduíches gourmet",`,
        replace: `id: "hamburgueres",
    name: "Hambúrgueres",
    icon: "🍔",
    description: "Hambúrgueres artesanais, smash burgers e sanduíches gourmet",
    crossSell: ["bebidas", "acompanhamentos"],
    extras: [{name: "Bacon Crocante", price: 4.5}, {name: "Cheddar Cremoso", price: 3.5}, {name: "Hambúrguer Extra", price: 8.5}, {name: "Cebola Caramelizada", price: 2.5}],`
    },
    {
        search: `id: "pizzas",
    name: "Pizzas",
    icon: "🍕",
    description: "Pizzas tradicionais e gourmet assadas no forno a lenha",`,
        replace: `id: "pizzas",
    name: "Pizzas",
    icon: "🍕",
    description: "Pizzas tradicionais e gourmet assadas no forno a lenha",
    crossSell: ["bebidas", "sobremesas"],
    extras: [{name: "Borda R. Catupiry", price: 12.0}, {name: "Borda R. Cheddar", price: 12.0}, {name: "Calabresa Extra", price: 6.0}, {name: "Queijo Extra", price: 8.0}],`
    },
    {
        search: `id: "pasteis",
    name: "Pastéis",
    icon: "🥟",
    description: "Pastéis crocantes fritos na hora com recheios variados",`,
        replace: `id: "pasteis",
    name: "Pastéis",
    icon: "🥟",
    description: "Pastéis crocantes fritos na hora com recheios variados",
    crossSell: ["bebidas"],
    extras: [{name: "Catupiry Extra", price: 3.0}, {name: "Cheddar Extra", price: 3.0}, {name: "Bacon em Cubos", price: 4.0}, {name: "Vinagrete", price: 2.5}],`
    },
    {
        search: `id: "japonesa",
    name: "Comida Japonesa",
    icon: "🍣",
    description: "Sushis, sashimis, temakis e pratos da culinária japonesa",`,
        replace: `id: "japonesa",
    name: "Comida Japonesa",
    icon: "🍣",
    description: "Sushis, sashimis, temakis e pratos da culinária japonesa",
    crossSell: ["bebidas", "sobremesas"],
    extras: [{name: "Cream Cheese Extra", price: 3.0}, {name: "Molho Tarê Extra", price: 2.5}, {name: "Gengibre Extra", price: 2.0}, {name: "Wasabi Extra", price: 2.0}],`
    },
    {
        search: `id: "massas",
    name: "Massas",
    icon: "🍝",
    description: "Massas artesanais com molhos clássicos e contemporâneos",`,
        replace: `id: "massas",
    name: "Massas",
    icon: "🍝",
    description: "Massas artesanais com molhos clássicos e contemporâneos",
    crossSell: ["bebidas", "sobremesas"],
    extras: [{name: "Parmesão Ralado", price: 4.0}, {name: "Pão Italiano", price: 6.0}, {name: "Bacon Grelhado", price: 5.0}],`
    },
    {
        search: `id: "tradicionais",
    name: "Comidas Tradicionais",
    icon: "🍛",
    description: "Pratos clássicos da culinária brasileira feitos com carinho",`,
        replace: `id: "tradicionais",
    name: "Comidas Tradicionais",
    icon: "🍛",
    description: "Pratos clássicos da culinária brasileira feitos com carinho",
    crossSell: ["bebidas", "acompanhamentos"],
    extras: [{name: "Ovo Frito", price: 3.0}, {name: "Farofa Rica", price: 4.5}, {name: "Vinagrete", price: 3.0}, {name: "Porção Extra Feijão", price: 5.0}],`
    },
    {
        search: `id: "sobremesas",
    name: "Sobremesas",
    icon: "🍰",
    description: "Doces e sobremesas irresistíveis para adoçar o seu dia",`,
        replace: `id: "sobremesas",
    name: "Sobremesas",
    icon: "🍰",
    description: "Doces e sobremesas irresistíveis para adoçar o seu dia",
    crossSell: ["bebidas"],
    extras: [{name: "Bola de Sorvete", price: 6.0}, {name: "Calda Extra", price: 3.5}, {name: "Morangos Frescos", price: 4.5}],`
    },
    {
        search: `id: "acompanhamentos",
    name: "Acompanhamentos",
    icon: "🍟",
    description: "Porções e acompanhamentos para completar o seu pedido",`,
        replace: `id: "acompanhamentos",
    name: "Acompanhamentos",
    icon: "🍟",
    description: "Porções e acompanhamentos para completar o seu pedido",
    crossSell: ["bebidas", "sobremesas"],
    extras: [{name: "Cheddar Adicional", price: 5.0}, {name: "Bacon Adicional", price: 6.0}, {name: "Queijo Ralado", price: 3.0}],`
    },
    {
        search: `id: "lanches-diversos",
    name: "Lanches Diversos",
    icon: "🌮",
    description: "Cachorro-quente, tapiocas, crepes, salgados e muito mais",`,
        replace: `id: "lanches-diversos",
    name: "Lanches Diversos",
    icon: "🌮",
    description: "Cachorro-quente, tapiocas, crepes, salgados e muito mais",
    crossSell: ["bebidas"],
    extras: [{name: "Catupiry", price: 3.0}, {name: "Cheddar", price: 3.0}, {name: "Bacon Extra", price: 4.0}, {name: "Batata Palha Extra", price: 2.0}],`
    }
];

replacements.forEach(({ search, replace }) => {
    content = content.replace(search, replace);
});

fs.writeFileSync('src/data/menuTemplates.ts', content, 'utf-8');
console.log('done updating menuTemplates.ts')

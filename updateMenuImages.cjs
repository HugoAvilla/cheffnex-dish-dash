const fs = require('fs');
const https = require('https');

const delay = ms => new Promise(res => setTimeout(res, ms));

async function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function searchUnsplash(query) {
    const url = `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(query)}&per_page=15`;
    const data = await fetchJson(url);
    if (data && data.results) {
        return data.results.map(img => img.id);
    }
    return [];
}

const templatesFile = 'c:\\Users\\hglav\\OneDrive\\Área de Trabalho\\CheffNex\\cheffnex-dish-dash\\src\\data\\menuTemplates.ts';
let content = fs.readFileSync(templatesFile, 'utf8');

// Match precisely the image_url line: image_url: "url"
const regex = /\{ name: "([^"]+)", description: "([^"]+)", price: ([\d.]+), image_url: "([^"]+)" \}/g;
const matches = [...content.matchAll(regex)];
console.log(`Found ${matches.length} products to process`);

(async () => {
    const usedIds = new Set();

    for (const match of matches) {
        const fullString = match[0];
        const name = match[1];

        // English queries to find specific high-quality food photography
        const translatedQueries = {
            // Hamburgueres
            "Smash Clássico": "smash burger hamburger",
            "Bacon Burguer": "bacon burger",
            "Duplo Cheddar": "double cheeseburger",
            "Frango Crispy": "crispy chicken burger",
            "Veggie Burger": "veggie burger",
            "X-Tudo": "big burger",
            "Costela Burger": "rib burger",
            "Smash Trufado": "gourmet burger",
            "Texas BBQ": "bbq burger",
            "Cheese Salada": "cheeseburger salad",
            "Picanha Burger": "picanha burger",
            "Kids Burger": "mini burger slider",
            "Australian Burger": "aussie burger australian",
            "Chili Burger": "chili burger",
            "Blue Cheese Burger": "blue cheese burger",
            "Wrap Burger": "wrap sandwich",

            // Pizzas
            "Margherita": "margherita pizza",
            "Calabresa": "pepperoni pizza",
            "Quatro Queijos": "cheese pizza",
            "Portuguesa": "pizza with egg onion",
            "Frango com Catupiry": "chicken pizza",
            "Pepperoni": "pepperoni pizza slice",
            "Napolitana": "neapolitan pizza",
            "Bacon com Cheddar": "bacon pizza",
            "Vegetariana": "vegetarian pizza",
            "Toscana": "sausage pizza",
            "Lombo Canadense": "ham pizza",
            "Atum": "tuna pizza",
            "Strogonoff": "creamy mushroom pizza",
            "Carne Seca com Catupiry": "brazilian pizza",
            "Doce de Leite com Banana": "sweet banana pizza dessert",
            "Romeu e Julieta": "cheese guava pizza dessert",
            "Camarão": "shrimp pizza",

            // Pastéis
            "Pastel de Carne": "beef empanada",
            "Pastel de Queijo": "cheese empanada",
            "Pastel de Frango": "chicken empanada",
            "Pastel de Pizza": "pizza empanada",
            "Pastel de Palmito": "hearts of palm empanada",
            "Pastel de Camarão": "shrimp empanada",
            "Pastel Napolitano": "tomato cheese empanada",
            "Pastel de Carne Seca": "jerked beef empanada",
            "Pastel de Calabresa": "sausage empanada",
            "Pastel de Bacalhau": "cod empanada",
            "Pastel de Quatro Queijos": "four cheese empanada",
            "Pastel de Banana com Chocolate": "chocolate banana empanada",
            "Pastel de Doce de Leite": "dulce de leche empanada",
            "Pastel de Romeu e Julieta": "guava cheese empanada",
            "Pastel de Milho": "corn cheese empanada",
            "Pastel de Linguiça": "pork sausage empanada",

            // Japonesa
            "Combo Sushi 15 peças": "sushi combo 15 pieces",
            "Combo Sushi 30 peças": "large sushi platter",
            "Sashimi de Salmão": "salmon sashimi",
            "Sashimi de Atum": "tuna sashimi",
            "Temaki de Salmão": "salmon temaki hand roll",
            "Temaki de Atum": "tuna temaki hand roll",
            "Temaki Skin": "crispy salmon skin temaki",
            "Uramaki Filadélfia": "uramaki sushi roll",
            "Uramaki Hot": "hot roll fried sushi",
            "Hot Roll": "fried sushi roll",
            "Niguiri de Salmão": "salmon nigiri",
            "Gunkan de Salmão": "gunkan sushi",
            "Joe de Salmão": "aburi salmon sushi",
            "Yakisoba de Frango": "chicken yakisoba noodles",
            "Yakisoba de Carne": "beef yakisoba noodles",
            "Missoshiro": "miso soup",
            "Gyoza": "gyoza dumplings",
            "Shimeji na Manteiga": "shimeji mushrooms butter",

            // Massas
            "Espaguete à Carbonara": "spaghetti carbonara",
            "Espaguete à Bolonhesa": "spaghetti bolognese",
            "Fettuccine Alfredo": "fettuccine alfredo",
            "Lasanha à Bolonhesa": "beef lasagna",
            "Lasanha Quatro Queijos": "cheese lasagna",
            "Nhoque ao Sugo": "gnocchi tomato sauce",
            "Nhoque à Parisiense": "gnocchi white sauce",
            "Penne ao Pesto": "penne pesto",
            "Ravioli de Ricota": "ricotta ravioli",
            "Canelone de Carne": "meat cannelloni",
            "Canelone de Ricota": "cheese cannelloni",
            "Talharim ao Alho e Óleo": "tagliatelle aglio e olio",
            "Talharim com Camarão": "tagliatelle shrimp",
            "Espaguete com Frutos do Mar": "seafood spaghetti",
            "Massa ao Quattro Formaggi": "four cheese pasta",
            "Panqueca de Carne": "savoury meat crepe",

            // Tradicionais
            "Feijoada Completa": "brazilian feijoada",
            "Frango à Parmegiana": "chicken parmigiana",
            "Bife à Parmegiana": "beef parmigiana",
            "Strogonoff de Frango": "chicken stroganoff",
            "Strogonoff de Carne": "beef stroganoff",
            "Escondidinho de Carne Seca": "brazilian escondidinho casserole",
            "Moqueca de Peixe": "brazilian moqueca fish stew",
            "Baião de Dois": "brazilian baiao de dois rice beans",
            "Picanha na Chapa": "brazilian picanha steak",
            "Galinhada Caipira": "brazilian chicken rice",
            "Bobó de Camarão": "brazilian shrimp stew bobo",
            "Arroz Carreteiro": "brazilian carreteiro rice beef",
            "Filé de Frango Grelhado": "grilled chicken breast rice",
            "Filé de Peixe Grelhado": "grilled fish fillet rice",
            "Tutu de Feijão": "brazilian beans sausage",
            "Rabada com Polenta": "oxtail stew with polenta",
            "Carne de Panela": "beef stew vegetables",

            // Sobremesas
            "Pudim de Leite": "brazilian pudim flan caramel",
            "Brownie com Sorvete": "brownie with ice cream dessert",
            "Açaí 300ml": "acai bowl small",
            "Açaí 500ml": "acai bowl large fruits",
            "Torta de Limão": "lemon tart meringue pie",
            "Mousse de Maracujá": "passion fruit mousse dessert",
            "Petit Gâteau": "petit gateau lava cake chocolate",
            "Cheesecake de Frutas Vermelhas": "berry cheesecake dessert",
            "Banana Caramelizada": "caramelized banana dessert",
            "Churros": "churros dulce de leche",
            "Brigadeiro Gourmet": "brazilian brigadeiro truffle chocolate",
            "Bolo de Cenoura": "carrot cake chocolate glaze slice",
            "Torta de Morango": "strawberry tart sweet",
            "Pavê de Chocolate": "chocolate pave dessert creamy",
            "Sorvete 2 Bolas": "two scoops ice cream sundae",

            // Bebidas
            "Coca-Cola 350ml": "coca cola can cold",
            "Coca-Cola 600ml": "coca cola bottle",
            "Coca-Cola Zero 350ml": "coca cola zero can",
            "Guaraná Antarctica 350ml": "guarana antarctica can",
            "Sprite 350ml": "sprite can",
            "Fanta Laranja 350ml": "fanta orange can",
            "Suco Natural de Laranja": "orange juice glass fresh",
            "Suco Natural de Maracujá": "passion fruit juice glass cold",
            "Suco Natural de Limão": "lemonade glass ice",
            "Suco Natural de Abacaxi com Hortelã": "pineapple mint juice glass fresh",
            "Água Mineral 500ml": "mineral water bottle",
            "Água com Gás 500ml": "sparkling water bottle",
            "Cerveja Heineken 600ml": "heineken beer bottle",
            "Cerveja Brahma 350ml": "beer can glass",
            "Milkshake de Chocolate": "chocolate milkshake whipped cream",
            "Milkshake de Morango": "strawberry milkshake whipped cream",
            "Chá Gelado de Limão": "iced tea lemon glass cold",
            "Café Expresso": "espresso coffee cup hot",

            // Acompanhamentos
            "Batata Frita": "french fries basket",
            "Batata com Cheddar e Bacon": "cheese bacon loaded fries",
            "Onion Rings": "onion rings fried",
            "Mandioca Frita": "fried cassava yuca fries",
            "Polenta Frita": "fried polenta sticks",
            "Arroz Branco": "white rice bowl food",
            "Arroz à Grega": "greek rice dish",
            "Feijão Tropeiro": "brazilian tropeiro beans dish",
            "Farofa Especial": "brazilian farofa dish",
            "Salada Caesar": "caesar salad fresh",
            "Salada Mista": "mixed salad vegetables",
            "Vinagrete": "vinaigrette salsa tomato",
            "Purê de Batata": "mashed potatoes bowl",
            "Nuggets de Frango": "chicken nuggets plate",
            "Isca de Frango": "fried chicken tenders basket",
            "Queijo Coalho na Brasa": "grilled cheese skewers coalho",

            // Lanches
            "Cachorro-Quente Tradicional": "hot dog with mustard",
            "Cachorro-Quente Especial": "gourmet loaded hot dog",
            "Tapioca de Frango": "tapioca chicken crepe flatbread",
            "Tapioca de Carne Seca": "tapioca beef flatbread",
            "Tapioca Romeu e Julieta": "sweet tapioca flatbread",
            "Crepe de Frango": "savory chicken crepe folded",
            "Crepe de Chocolate": "sweet chocolate crepe folded",
            "Coxinha": "brazilian coxinha fried chicken",
            "Empada de Frango": "brazilian chicken empada mini pie",
            "Quibe Frito": "fried kibbeh meat",
            "Bolinha de Queijo": "fried cheese balls plate",
            "Misto Quente": "grilled ham cheese sandwich toasted pan",
            "Bauru": "bauru sandwich brazilian meat",
            "Croissant de Presunto e Queijo": "ham cheese croissant baked",
            "Wrap de Frango": "chicken wrap sandwich cut",
            "Pão de Queijo": "brazilian cheese bread pao de queijo basket"
        };

        let query = translatedQueries[name] || name;
        console.log(`Searching for: ${name} (${query})`);

        try {
            const ids = await searchUnsplash(query);

            let selectedId = null;
            for (const id of ids) {
                if (!usedIds.has(id)) {
                    selectedId = id;
                    usedIds.add(id);
                    break;
                }
            }

            // fallback to generic query if all items are used up
            if (!selectedId && ids.length > 0) {
                selectedId = ids[Math.floor(Math.random() * ids.length)];
            }

            if (selectedId) {
                const newUrl = `https://images.unsplash.com/photo-${selectedId}?auto=format&fit=crop&q=80&w=800`;
                const newString = fullString.replace(/image_url: "[^"]+"/, `image_url: "${newUrl}"`);
                content = content.replace(fullString, newString);
                console.log(`  -> Found ${selectedId}`);
            } else {
                console.log(`  -> No images found for ${name}`);
            }
        } catch (err) {
            console.log(`  -> Error: ${err.message}`);
        }

        await delay(300);
    }

    fs.writeFileSync(templatesFile, content);
    console.log("Done updating menuTemplates.ts");
})();

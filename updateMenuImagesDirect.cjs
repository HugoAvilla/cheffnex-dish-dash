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

async function searchUnsplashUrls(query) {
    const url = `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(query)}&per_page=15`;
    const data = await fetchJson(url);
    if (data && data.results) {
        // Return only non-premium photos to avoid watermarks
        return data.results
            .filter(img => !img.premium)
            .map(img => img.urls.regular.split('?')[0] + '?auto=format&fit=crop&q=80&w=800');
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
    const usedUrls = new Set();

    for (const match of matches) {
        const fullString = match[0];
        const name = match[1];

        // English queries to find specific high-quality food photography
        const translatedQueries = {
            // Hamburgueres
            "Smash Clássico": "smash burger",
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
            "Combo Sushi 15 peças": "sushi combo",
            "Combo Sushi 30 peças": "sushi platter",
            "Sashimi de Salmão": "salmon sashimi",
            "Sashimi de Atum": "tuna sashimi",
            "Temaki de Salmão": "salmon temaki hand roll",
            "Temaki de Atum": "tuna temaki hand roll",
            "Temaki Skin": "crispy salmon skin temaki",
            "Uramaki Filadélfia": "uramaki roll",
            "Uramaki Hot": "hot roll fried sushi",
            "Hot Roll": "fried sushi roll",
            "Niguiri de Salmão": "salmon nigiri",
            "Gunkan de Salmão": "gunkan sushi",
            "Joe de Salmão": "aburi salmon sushi",
            "Yakisoba de Frango": "chicken yakisoba",
            "Yakisoba de Carne": "beef yakisoba",
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
            "Escondidinho de Carne Seca": "brazilian escondidinho",
            "Moqueca de Peixe": "brazilian moqueca",
            "Baião de Dois": "brazilian baiao de dois",
            "Picanha na Chapa": "brazilian picanha steak",
            "Galinhada Caipira": "brazilian chicken rice",
            "Bobó de Camarão": "brazilian shrimp bobo",
            "Arroz Carreteiro": "brazilian carreteiro",
            "Filé de Frango Grelhado": "grilled chicken breast rice",
            "Filé de Peixe Grelhado": "grilled fish fillet rice",
            "Tutu de Feijão": "brazilian beans sausage",
            "Rabada com Polenta": "oxtail stew with polenta",
            "Carne de Panela": "beef stew vegetables",

            // Sobremesas
            "Pudim de Leite": "brazilian pudim flan caramel",
            "Brownie com Sorvete": "brownie ice cream",
            "Açaí 300ml": "acai bowl",
            "Açaí 500ml": "acai bowl fruits",
            "Torta de Limão": "lemon tart meringue pie",
            "Mousse de Maracujá": "passion fruit mousse",
            "Petit Gâteau": "petit gateau lava cake",
            "Cheesecake de Frutas Vermelhas": "berry cheesecake",
            "Banana Caramelizada": "caramelized banana",
            "Churros": "churros dulce de leche",
            "Brigadeiro Gourmet": "brazilian brigadeiro truffle",
            "Bolo de Cenoura": "carrot cake chocolate slice",
            "Torta de Morango": "strawberry tart sweet",
            "Pavê de Chocolate": "chocolate pave dessert",
            "Sorvete 2 Bolas": "two scoops ice cream",

            // Bebidas
            "Coca-Cola 350ml": "coca cola can cold",
            "Coca-Cola 600ml": "coca cola bottle",
            "Coca-Cola Zero 350ml": "coca cola zero can",
            "Guaraná Antarctica 350ml": "guarana can",
            "Sprite 350ml": "sprite can",
            "Fanta Laranja 350ml": "fanta orange can",
            "Suco Natural de Laranja": "orange juice glass",
            "Suco Natural de Maracujá": "passion fruit juice glass",
            "Suco Natural de Limão": "lemonade glass",
            "Suco Natural de Abacaxi com Hortelã": "pineapple mint juice glass",
            "Água Mineral 500ml": "mineral water bottle",
            "Água com Gás 500ml": "sparkling water bottle",
            "Cerveja Heineken 600ml": "heineken beer bottle",
            "Cerveja Brahma 350ml": "beer can glass",
            "Milkshake de Chocolate": "chocolate milkshake",
            "Milkshake de Morango": "strawberry milkshake",
            "Chá Gelado de Limão": "iced tea glass",
            "Café Expresso": "espresso coffee cup",

            // Acompanhamentos
            "Batata Frita": "french fries",
            "Batata com Cheddar e Bacon": "cheese bacon loaded fries",
            "Onion Rings": "onion rings fried",
            "Mandioca Frita": "fried cassava yuca fries",
            "Polenta Frita": "fried polenta sticks",
            "Arroz Branco": "white rice bowl",
            "Arroz à Grega": "greek rice dish",
            "Feijão Tropeiro": "brazilian tropeiro beans",
            "Farofa Especial": "brazilian farofa dish",
            "Salada Caesar": "caesar salad",
            "Salada Mista": "mixed salad vegetables",
            "Vinagrete": "vinaigrette salsa tomato",
            "Purê de Batata": "mashed potatoes bowl",
            "Nuggets de Frango": "chicken nuggets plate",
            "Isca de Frango": "fried chicken tenders",
            "Queijo Coalho na Brasa": "grilled cheese skewers coalho",

            // Lanches
            "Cachorro-Quente Tradicional": "hot dog with mustard",
            "Cachorro-Quente Especial": "gourmet loaded hot dog",
            "Tapioca de Frango": "tapioca chicken crepe",
            "Tapioca de Carne Seca": "tapioca beef flatbread",
            "Tapioca Romeu e Julieta": "sweet tapioca flatbread",
            "Crepe de Frango": "savory chicken crepe",
            "Crepe de Chocolate": "sweet chocolate crepe",
            "Coxinha": "brazilian coxinha fried chicken",
            "Empada de Frango": "brazilian empada minipie",
            "Quibe Frito": "fried kibbeh meat",
            "Bolinha de Queijo": "fried cheese balls",
            "Misto Quente": "grilled ham cheese sandwich toasted",
            "Bauru": "bauru sandwich brazilian meat",
            "Croissant de Presunto e Queijo": "ham cheese croissant",
            "Wrap de Frango": "chicken wrap sandwich cut",
            "Pão de Queijo": "brazilian cheese bread pao de queijo basket"
        };

        let query = translatedQueries[name] || name;
        console.log(`Searching for: ${name} (${query})`);

        try {
            const urls = await searchUnsplashUrls(query);

            // Fallback
            if (urls.length === 0) {
                // Broaden the search
                const fallbackQuery = query.split(' ')[0] + " food";
                const fallbackUrls = await searchUnsplashUrls(fallbackQuery);
                urls.push(...fallbackUrls);
            }

            let selectedUrl = null;
            for (const url of urls) {
                if (!usedUrls.has(url)) {
                    selectedUrl = url;
                    usedUrls.add(url);
                    break;
                }
            }

            // If all are used, random pick from the ones we got
            if (!selectedUrl && urls.length > 0) {
                selectedUrl = urls[Math.floor(Math.random() * urls.length)];
            }

            if (selectedUrl) {
                // Note: the URL strings in menuTemplates.ts might contain special characters in regex. 
                // We capture the old URL in match[4]
                const oldUrl = match[4];
                content = content.replace(oldUrl, selectedUrl);
                console.log(`  -> Found ${selectedUrl}`);
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

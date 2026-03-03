const fs = require('fs');
let content = fs.readFileSync('src/data/menuTemplates.ts', 'utf-8');

// Map each product name to a unique Unsplash image URL
const productImages = {
    // === HAMBÚRGUERES ===
    "Smash Clássico": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800",
    "Bacon Burguer": "https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&q=80&w=800",
    "Duplo Cheddar": "https://images.unsplash.com/photo-1586816001966-79b736744398?auto=format&fit=crop&q=80&w=800",
    "Frango Crispy": "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&q=80&w=800",
    "Veggie Burger": "https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&q=80&w=800",
    "X-Tudo": "https://images.unsplash.com/photo-1551615593-ef5fe247e8f7?auto=format&fit=crop&q=80&w=800",
    "Costela Burger": "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&q=80&w=800",
    "Smash Trufado": "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&q=80&w=800",
    "Texas BBQ": "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=800",
    "Cheese Salada": "https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&q=80&w=800",
    "Picanha Burger": "https://images.unsplash.com/photo-1608767221gy-fb0aff8b715a?auto=format&fit=crop&q=80&w=800",
    "Kids Burger": "https://images.unsplash.com/photo-1565299507177-b0ac66763828?auto=format&fit=crop&q=80&w=800",
    "Australian Burger": "https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&q=80&w=800",
    "Chili Burger": "https://images.unsplash.com/photo-1596662951482-0c4ba74a6df6?auto=format&fit=crop&q=80&w=800",
    "Blue Cheese Burger": "https://images.unsplash.com/photo-1525164286253-04e68b9d94c6?auto=format&fit=crop&q=80&w=800",
    "Wrap Burger": "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&q=80&w=800",

    // === PIZZAS ===
    "Margherita": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&q=80&w=800",
    "Calabresa": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800",
    "Quatro Queijos": "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&q=80&w=800",
    "Portuguesa": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800",
    "Frango com Catupiry": "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&q=80&w=800",
    "Pepperoni": "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=800",
    "Napolitana": "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&q=80&w=800",
    "Bacon com Cheddar": "https://images.unsplash.com/photo-1600028068383-ea11a7a101f3?auto=format&fit=crop&q=80&w=800",
    "Vegetariana": "https://images.unsplash.com/photo-1511689660979-10d2b1aada49?auto=format&fit=crop&q=80&w=800",
    "Toscana": "https://images.unsplash.com/photo-1595708684082-a173bb3a06c5?auto=format&fit=crop&q=80&w=800",
    "Lombo Canadense": "https://images.unsplash.com/photo-1588315029754-2dd089d39a1a?auto=format&fit=crop&q=80&w=800",
    "Atum": "https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&q=80&w=800",
    "Strogonoff": "https://images.unsplash.com/photo-1606502281004-f86cf1282af2?auto=format&fit=crop&q=80&w=800",
    "Carne Seca com Catupiry": "https://images.unsplash.com/photo-1614838747274-e3320a2f3b4b?auto=format&fit=crop&q=80&w=800",
    "Doce de Leite com Banana": "https://images.unsplash.com/photo-1541745537411-b8d1e5829e17?auto=format&fit=crop&q=80&w=800",
    "Romeu e Julieta": "https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?auto=format&fit=crop&q=80&w=800",
    "Camarão": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&q=80&w=800",

    // === PASTÉIS ===
    "Pastel de Carne": "https://images.unsplash.com/photo-1644062484666-4c4c81062b8d?auto=format&fit=crop&q=80&w=800",
    "Pastel de Queijo": "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&q=80&w=800",
    "Pastel de Frango": "https://images.unsplash.com/photo-1605478371310-a9f1e96b4ff4?auto=format&fit=crop&q=80&w=800",
    "Pastel de Pizza": "https://images.unsplash.com/photo-1609167830220-7164aa7bf827?auto=format&fit=crop&q=80&w=800",
    "Pastel de Palmito": "https://images.unsplash.com/photo-1601000938365-f542bff86ce4?auto=format&fit=crop&q=80&w=800",
    "Pastel de Camarão": "https://images.unsplash.com/photo-1617692855027-33b14f061079?auto=format&fit=crop&q=80&w=800",
    "Pastel Napolitano": "https://images.unsplash.com/photo-1600803907087-f56d462fd26b?auto=format&fit=crop&q=80&w=800",
    "Pastel de Carne Seca": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80&w=800",
    "Pastel de Calabresa": "https://images.unsplash.com/photo-1607478900766-efe13248b125?auto=format&fit=crop&q=80&w=800",
    "Pastel de Bacalhau": "https://images.unsplash.com/photo-1584278860047-22db9ff82bed?auto=format&fit=crop&q=80&w=800",
    "Pastel de Quatro Queijos": "https://images.unsplash.com/photo-1610614819513-58e34989848b?auto=format&fit=crop&q=80&w=800",
    "Pastel de Banana com Chocolate": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=800",
    "Pastel de Doce de Leite": "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&q=80&w=800",
    "Pastel de Romeu e Julieta": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&q=80&w=800",
    "Pastel de Milho": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=800",
    "Pastel de Linguiça": "https://images.unsplash.com/photo-1619221882220-947b3d3c8861?auto=format&fit=crop&q=80&w=800",

    // === COMIDA JAPONESA ===
    "Combo Sushi 15 peças": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=800",
    "Combo Sushi 30 peças": "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&q=80&w=800",
    "Sashimi de Salmão": "https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&q=80&w=800",
    "Sashimi de Atum": "https://images.unsplash.com/photo-1582450871972-ab5ca641643d?auto=format&fit=crop&q=80&w=800",
    "Temaki de Salmão": "https://images.unsplash.com/photo-1617196034183-421b4917c92d?auto=format&fit=crop&q=80&w=800",
    "Temaki de Atum": "https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&q=80&w=800",
    "Temaki Skin": "https://images.unsplash.com/photo-1583623025817-d180a2221d0a?auto=format&fit=crop&q=80&w=800",
    "Uramaki Filadélfia": "https://images.unsplash.com/photo-1617196035154-1e7e6e28b0db?auto=format&fit=crop&q=80&w=800",
    "Uramaki Hot": "https://images.unsplash.com/photo-1562802378-063ec186a863?auto=format&fit=crop&q=80&w=800",
    "Hot Roll": "https://images.unsplash.com/photo-1559410545-0bdcd187e0a6?auto=format&fit=crop&q=80&w=800",
    "Niguiri de Salmão": "https://images.unsplash.com/photo-1615361200141-f45040f367be?auto=format&fit=crop&q=80&w=800",
    "Gunkan de Salmão": "https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?auto=format&fit=crop&q=80&w=800",
    "Joe de Salmão": "https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&q=80&w=800",
    "Yakisoba de Frango": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&q=80&w=800",
    "Yakisoba de Carne": "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&q=80&w=800",
    "Missoshiro": "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=800",
    "Gyoza": "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&q=80&w=800",
    "Shimeji na Manteiga": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800",

    // === MASSAS ===
    "Espaguete à Carbonara": "https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&q=80&w=800",
    "Espaguete à Bolonhesa": "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&q=80&w=800",
    "Fettuccine Alfredo": "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&q=80&w=800",
    "Lasanha à Bolonhesa": "https://images.unsplash.com/photo-1614961233913-a5113a4a34ed?auto=format&fit=crop&q=80&w=800",
    "Lasanha Quatro Queijos": "https://images.unsplash.com/photo-1560684352-8497838b0818?auto=format&fit=crop&q=80&w=800",
    "Nhoque ao Sugo": "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=800",
    "Nhoque à Parisiense": "https://images.unsplash.com/photo-1598866594230-a7c12756260f?auto=format&fit=crop&q=80&w=800",
    "Penne ao Pesto": "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&q=80&w=800",
    "Ravioli de Ricota": "https://images.unsplash.com/photo-1587740908075-9e245070dfaa?auto=format&fit=crop&q=80&w=800",
    "Canelone de Carne": "https://images.unsplash.com/photo-1626844131902-bf48a3817b6e?auto=format&fit=crop&q=80&w=800",
    "Canelone de Ricota": "https://images.unsplash.com/photo-1608219992759-8d74ed8d76eb?auto=format&fit=crop&q=80&w=800",
    "Talharim ao Alho e Óleo": "https://images.unsplash.com/photo-1556761223-4c4282c73f77?auto=format&fit=crop&q=80&w=800",
    "Talharim com Camarão": "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&q=80&w=800",
    "Espaguete com Frutos do Mar": "https://images.unsplash.com/photo-1534080564583-6be75777b70a?auto=format&fit=crop&q=80&w=800",
    "Massa ao Quattro Formaggi": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?auto=format&fit=crop&q=80&w=800",
    "Panqueca de Carne": "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&q=80&w=800",

    // === COMIDAS TRADICIONAIS ===
    "Feijoada Completa": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=800",
    "Frango à Parmegiana": "https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?auto=format&fit=crop&q=80&w=800",
    "Bife à Parmegiana": "https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?auto=format&fit=crop&q=80&w=800",
    "Strogonoff de Frango": "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&q=80&w=800",
    "Strogonoff de Carne": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800",
    "Escondidinho de Carne Seca": "https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&q=80&w=800",
    "Moqueca de Peixe": "https://images.unsplash.com/photo-1535140728325-a4d3707eee61?auto=format&fit=crop&q=80&w=800",
    "Baião de Dois": "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=800",
    "Picanha na Chapa": "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&q=80&w=800",
    "Galinhada Caipira": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80&w=800",
    "Bobó de Camarão": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=800",
    "Arroz Carreteiro": "https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&q=80&w=800",
    "Filé de Frango Grelhado": "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&q=80&w=800",
    "Filé de Peixe Grelhado": "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=800",
    "Tutu de Feijão": "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=800",
    "Rabada com Polenta": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800",
    "Carne de Panela": "https://images.unsplash.com/photo-1608835291093-394b0c943a75?auto=format&fit=crop&q=80&w=800",

    // === SOBREMESAS ===
    "Pudim de Leite": "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?auto=format&fit=crop&q=80&w=800",
    "Brownie com Sorvete": "https://images.unsplash.com/photo-1564355808539-22fda35bed7e?auto=format&fit=crop&q=80&w=800",
    "Açaí 300ml": "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&q=80&w=800",
    "Açaí 500ml": "https://images.unsplash.com/photo-1577003811926-53b288a6e5d0?auto=format&fit=crop&q=80&w=800",
    "Torta de Limão": "https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&q=80&w=800",
    "Mousse de Maracujá": "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=80&w=800",
    "Petit Gâteau": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=800",
    "Cheesecake de Frutas Vermelhas": "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&q=80&w=800",
    "Banana Caramelizada": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&q=80&w=800",
    "Churros": "https://images.unsplash.com/photo-1624371414361-089e19881db0?auto=format&fit=crop&q=80&w=800",
    "Brigadeiro Gourmet": "https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?auto=format&fit=crop&q=80&w=800",
    "Bolo de Cenoura": "https://images.unsplash.com/photo-1621303837174-89787a7d4729?auto=format&fit=crop&q=80&w=800",
    "Torta de Morango": "https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?auto=format&fit=crop&q=80&w=800",
    "Pavê de Chocolate": "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=800",
    "Sorvete 2 Bolas": "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&q=80&w=800",

    // === BEBIDAS ===
    "Coca-Cola 350ml": "https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&q=80&w=800",
    "Coca-Cola 600ml": "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&q=80&w=800",
    "Coca-Cola Zero 350ml": "https://images.unsplash.com/photo-1596803244618-8dbee441d70b?auto=format&fit=crop&q=80&w=800",
    "Guaraná Antarctica 350ml": "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&q=80&w=800",
    "Sprite 350ml": "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&q=80&w=800",
    "Fanta Laranja 350ml": "https://images.unsplash.com/photo-1624517452488-04869289c4ca?auto=format&fit=crop&q=80&w=800",
    "Suco Natural de Laranja": "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&q=80&w=800",
    "Suco Natural de Maracujá": "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=80&w=800",
    "Suco Natural de Limão": "https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9e?auto=format&fit=crop&q=80&w=800",
    "Suco Natural de Abacaxi com Hortelã": "https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?auto=format&fit=crop&q=80&w=800",
    "Água Mineral 500ml": "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&q=80&w=800",
    "Água com Gás 500ml": "https://images.unsplash.com/photo-1560023907-5f339617ea30?auto=format&fit=crop&q=80&w=800",
    "Cerveja Heineken 600ml": "https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&q=80&w=800",
    "Cerveja Brahma 350ml": "https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&q=80&w=800",
    "Milkshake de Chocolate": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=800",
    "Milkshake de Morango": "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&q=80&w=800",
    "Chá Gelado de Limão": "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=800",
    "Café Expresso": "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&q=80&w=800",

    // === ACOMPANHAMENTOS ===
    "Batata Frita": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80&w=800",
    "Batata com Cheddar e Bacon": "https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&q=80&w=800",
    "Onion Rings": "https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&q=80&w=800",
    "Mandioca Frita": "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=800",
    "Polenta Frita": "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&q=80&w=800",
    "Arroz Branco": "https://images.unsplash.com/photo-1536304993881-460346b318bd?auto=format&fit=crop&q=80&w=800",
    "Arroz à Grega": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&q=80&w=800",
    "Feijão Tropeiro": "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=800",
    "Farofa Especial": "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&q=80&w=800",
    "Salada Caesar": "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&q=80&w=800",
    "Salada Mista": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800",
    "Vinagrete": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&q=80&w=800",
    "Purê de Batata": "https://images.unsplash.com/photo-1585672840563-f2af2ced55c9?auto=format&fit=crop&q=80&w=800",
    "Nuggets de Frango": "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&q=80&w=800",
    "Isca de Frango": "https://images.unsplash.com/photo-1614398751058-a495c30e7fe5?auto=format&fit=crop&q=80&w=800",
    "Queijo Coalho na Brasa": "https://images.unsplash.com/photo-1531749668029-2db88e4c116d?auto=format&fit=crop&q=80&w=800",

    // === LANCHES DIVERSOS ===
    "Cachorro-Quente Tradicional": "https://images.unsplash.com/photo-1612392062126-e740bb3e3586?auto=format&fit=crop&q=80&w=800",
    "Cachorro-Quente Especial": "https://images.unsplash.com/photo-1619740455993-9d701c8bb990?auto=format&fit=crop&q=80&w=800",
    "Tapioca de Frango": "https://images.unsplash.com/photo-1604467707321-70d009801bf2?auto=format&fit=crop&q=80&w=800",
    "Tapioca de Carne Seca": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&q=80&w=800",
    "Tapioca Romeu e Julieta": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&q=80&w=800",
    "Crepe de Frango": "https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&q=80&w=800",
    "Crepe de Chocolate": "https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&q=80&w=800",
    "Coxinha": "https://images.unsplash.com/photo-1591983468977-ccd51e57d0a7?auto=format&fit=crop&q=80&w=800",
    "Empada de Frango": "https://images.unsplash.com/photo-1607478900766-efe13248b125?auto=format&fit=crop&q=80&w=800",
    "Quibe Frito": "https://images.unsplash.com/photo-1579888944880-d98341245702?auto=format&fit=crop&q=80&w=800",
    "Bolinha de Queijo": "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&q=80&w=800",
    "Misto Quente": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=800",
    "Bauru": "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&q=80&w=800",
    "Croissant de Presunto e Queijo": "https://images.unsplash.com/photo-1555507036-ab1f4038024a?auto=format&fit=crop&q=80&w=800",
    "Wrap de Frango": "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&q=80&w=800",
    "Pão de Queijo": "https://images.unsplash.com/photo-1598733868929-9af34b4222c2?auto=format&fit=crop&q=80&w=800",
};

// Replace each product's image_url
let replacements = 0;
for (const [name, url] of Object.entries(productImages)) {
    // Escape special chars for regex
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match: name: "ProductName", description: "...", price: X.XX, image_url: "OLD_URL"
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

// Handle "Romeu e Julieta" in sobremesas separately (it conflicts with pizza category)
// The pizza one has already been replaced above. For sobremesas, we need context-aware replacement.
// Actually the regex already handles this because each "Romeu e Julieta" has different descriptions/prices.

fs.writeFileSync('src/data/menuTemplates.ts', content, 'utf-8');
console.log(`Done! Replaced images for ${replacements} products.`);

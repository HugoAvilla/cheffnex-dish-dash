

## Correcao de Dimensoes do Cardapio

### Analise do Estado Atual

Inspecionei o cardapio no desktop (1067px) e mobile (390px). Identifiquei os seguintes problemas de dimensao:

### Problemas Encontrados

**1. Cards de produto com imagem muito alta (aspect-[4/3])**
No mobile, cada card ocupa quase toda a tela verticalmente. O aspect ratio 4:3 e muito alto para cards de cardapio — o padrao mais funcional e 16:10 ou 3:2, que mostra a imagem sem dominar o card.

**2. Banner muito alto no mobile (h-56 = 224px)**
Ocupa mais de 25% da tela no mobile, empurrando o conteudo util para baixo. O usuario precisa rolar muito para ver os produtos.

**3. Logo overlap excessivo (-mt-10)**
O logo com -mt-10 cria um gap visual grande entre o banner e a area de busca.

**4. Ticker de promocoes sem altura fixa**
Pode causar layout shift se o conteudo mudar.

**5. Botao "Ver sacola" sobrepoe o ultimo card**
O botao fixo no bottom-4 com pb-24 no container pode nao ser suficiente em telas pequenas.

### Solucao

**Arquivo: `src/components/menu/MenuHeader.tsx`**
- Banner: `h-44 md:h-56` (reduzir de h-56/h-72)
- Logo: reduzir de `h-20 w-20 md:h-24 md:w-24` para `h-16 w-16 md:h-20 md:w-20`
- Overlap: `-mt-8` em vez de `-mt-10`

**Arquivo: `src/components/menu/MenuProductCard.tsx`**
- Imagem: `aspect-[16/10]` em vez de `aspect-[4/3]` — mais compacto, mostra mais produtos por tela

**Arquivo: `src/pages/Menu.tsx`**
- Ticker: adicionar `h-8` fixo (ja tem, verificar se esta aplicado corretamente)
- Padding bottom do container: garantir `pb-28` no mobile para nao ser cortado pelo botao flutuante

### Resumo

| Arquivo | Mudanca |
|---|---|
| `MenuHeader.tsx` | Banner menor, logo menor, overlap reduzido |
| `MenuProductCard.tsx` | Aspect ratio 16:10 (mais compacto) |
| `Menu.tsx` | Padding bottom ajustado para mobile |

Mudancas apenas de dimensao/espacamento — nenhuma alteracao de logica ou funcionalidade.


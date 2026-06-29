# Adega do Mercado — Recomendação de Vinhos

Aplicativo de quiosque/totem (uso em **tablet**) para recomendar vinhos da
**Planos Supermercados**. Funciona 100% offline, sem build e sem servidor —
basta abrir o `index.html` num navegador.

## Como usar

- **Tablet/quiosque:** abra `index.html` em tela cheia no navegador.
- **Para testar no PC:** abra `index.html` direto, ou rode um servidor local:
  ```
  python -m http.server 8123
  ```
  e acesse `http://localhost:8123`.

## Estrutura do projeto

```
VINHOS/
├── index.html              ← página principal (só o esqueleto HTML)
├── css/
│   ├── styles.css          ← todo o estilo do app
│   └── fonts.css           ← @font-face das fontes locais (offline)
├── js/
│   └── app.js              ← toda a lógica (motor de recomendação, telas, admin)
├── assets/
│   ├── fonts/              ← fontes auto-hospedadas (.woff2)
│   └── imagens/
│       ├── logo/           ← logo Planos Supermercados
│       ├── fundo/          ← imagem de fundo da tela inicial
│       ├── tipos/          ← fotos dos tipos de vinho (tinto, branco…)
│       ├── tacas/          ← taças por tipo de vinho
│       ├── caminhos/       ← imagens dos 3 caminhos da home
│       ├── comidas/        ← fotos dos pratos (harmonização)
│       ├── ocasioes/       ← fotos das ocasiões
│       └── bandeiras/      ← bandeiras dos países (.png)
└── referencias/            ← fotos do totem do Super Muffato (inspiração; não usadas no app)
```

## Área administrativa

- Acesse pelo ícone de engrenagem (⚙️) no canto da tela inicial.
- **Senha:** `1234` (definida em `js/app.js`).
- Permite cadastrar, editar, ativar/desativar vinhos e resetar o catálogo.
- O catálogo é salvo no `localStorage` do navegador do tablet.

## O que foi feito nesta revisão

1. **Correção de bug crítico:** os campos do formulário de cadastro/edição de
   vinhos não atualizavam o estado (faltava o tratamento de `data-field`),
   então as edições não eram salvas. Corrigido em `js/app.js` (`onInput`).
2. **Offline / confiabilidade no tablet:** todas as ~30 imagens remotas
   (Unsplash + CDN temporária do Google, que iria expirar) e as fontes do
   Google Fonts foram baixadas e passaram a ser servidas localmente.
   O ícone do Material Symbols foi reduzido de ~3,9 MB para ~72 KB (subset).
3. **Organização:** o arquivo único de ~2.900 linhas foi separado em
   `index.html` + `css/` + `js/`, com as imagens em pastas por categoria.
4. **Otimização:** remoção de código morto (`bottleSVG`, `wineFill`, `meterRow`,
   `field`, `fieldGroup`, `PRICE_DESC`), de CSS não utilizado (`welcome-decor-*`)
   e das variantes de fonte desnecessárias (subset `latin-ext` e itálico),
   reduzindo as fontes de ~4,9 MB para ~536 KB.
5. **Limpeza:** removidos a versão original monolítica de backup e os arquivos
   desnecessários; ficou apenas o que o app precisa para rodar.

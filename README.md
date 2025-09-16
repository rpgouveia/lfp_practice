# 🧮 Normalizador de Fórmulas Lógicas

Uma aplicação web para transformar fórmulas lógicas em diferentes formas normais: CNF, DNF, Forma Clausal e Cláusulas de Horn.

## 📁 Estrutura de Arquivos

```
projeto/
├── index.html      # Estrutura HTML da página
├── styles.css      # Estilos CSS
├── script.js       # Lógica JavaScript
└── README.md       # Este arquivo
```

## 🚀 Como Usar

### Opção 1: Localmente

1. **Crie uma pasta** para o projeto
2. **Salve os arquivos**:
   - `index.html`
   - `styles.css`
   - `script.js`
3. **Abra o arquivo `index.html`** em qualquer navegador moderno

### Opção 2: GitHub Pages

1. **Crie um repositório** no GitHub
2. **Faça upload dos 3 arquivos** (index.html, styles.css, script.js)
3. **Ative o GitHub Pages**:
   - Vá em Settings → Pages
   - Source: Deploy from a branch
   - Branch: main / root
   - Save

4. **Acesse sua aplicação** em:
   ```
   https://rpgouveia.github.io/lfp_practice/
   ```

## 🔧 Funcionalidades

### Transformações Suportadas

1. **Forma Normal Conjuntiva Prenex (PCNF)**
   - Elimina bicondicionais e implicações
   - Aplica Lei de De Morgan
   - Move quantificadores para o início
   - Distribui ∨ sobre ∧

2. **Forma Normal Disjuntiva Prenex (PDNF)**
   - Similar ao CNF, mas distribui ∧ sobre ∨

3. **Forma Clausal**
   - Converte para CNF
   - Aplica Skolemização
   - Remove quantificadores universais
   - Extrai cláusulas individuais

4. **Cláusulas de Horn**
   - Identifica cláusulas com no máximo um literal positivo
   - Separa cláusulas Horn de não-Horn

### Sintaxe LaTeX Suportada

| Operador | LaTeX | Símbolo |
|----------|-------|---------|
| Conjunção | `\land` | ∧ |
| Disjunção | `\lor` | ∨ |
| Negação | `\neg` | ¬ |
| Implicação | `\rightarrow` | → |
| Bicondicional | `\leftrightarrow` | ↔ |
| Para todo | `\forall` | ∀ |
| Existe | `\exists` | ∃ |

### Exemplos de Fórmulas

```latex
P \land Q
P \lor Q
P \rightarrow Q
\neg P
P \leftrightarrow Q
(P \land Q) \rightarrow R
\neg (P \lor Q)
\forall x P(x)
\exists x P(x)
```

## 🎨 Personalização

### Cores Principais (em styles.css)

```css
/* Gradiente principal */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Cor primária */
#667eea

/* Cor de sucesso */
#48bb78

/* Cor de erro */
#f56565
```

### Responsividade

O CSS inclui media queries para dispositivos móveis:
- Breakpoint principal: 768px
- Layout adaptativo para telas pequenas

## 📚 Estrutura do Código JavaScript

### Classes Principais

1. **FormulaParser**
   - Converte LaTeX para notação interna
   - Detecta tipo de fórmula (proposicional/primeira ordem)

2. **FormulaTransformer**
   - Implementa todas as transformações
   - Mantém histórico de passos
   - Métodos para CNF, DNF, Clausal e Horn

### Funções da Interface

- `processFormula()` - Processa a entrada do usuário
- `displayResult()` - Exibe resultados formatados
- `renderFormula()` - Renderiza LaTeX com MathJax
- `loadExample()` - Carrega exemplo aleatório
- `clearAll()` - Limpa interface

## 🐛 Debug e Desenvolvimento

### Console do Navegador

Abra o console (F12) para ver logs detalhados:
- Processo de parsing
- Transformações aplicadas
- Erros capturados

### Mensagens de Log

```javascript
console.log('Parseando fórmula:', formula);
console.log('Gerando CNF...');
console.log('Processamento concluído!');
```

## 📦 Dependências Externas

- **MathJax 3.2.2** - Renderização de fórmulas LaTeX
  ```html
  https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-mml-chtml.js
  ```

## 🤝 Contribuindo

Para melhorar o projeto:

1. Adicione novas transformações em `FormulaTransformer`
2. Melhore o parser para suportar mais sintaxe
3. Adicione testes automatizados
4. Melhore a interface visual

## 📝 Licença

Este projeto é de código aberto para fins educacionais.

## 🆘 Suporte

Se encontrar problemas:
1. Verifique o console do navegador
2. Teste com fórmulas mais simples
3. Verifique a sintaxe LaTeX
4. Certifique-se de que todos os arquivos estão no mesmo diretório

----
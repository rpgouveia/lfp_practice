class FormulaParser {
    constructor(formula) {
        this.formula = formula.trim();
        this.position = 0;
    }

    parse() {
        try {
            return this.parseFormula();
        } catch (error) {
            throw new Error(`Erro ao analisar fórmula: ${error.message}`);
        }
    }

    parseFormula() {
        console.log('Parseando fórmula:', this.formula);
        
        // Remove espaços extras
        this.formula = this.formula.replace(/\s+/g, ' ');
        
        // Converte notação LaTeX para interna
        let processed = this.formula
            .replace(/\\forall/g, '∀')
            .replace(/\\exists/g, '∃')
            .replace(/\\land/g, '∧')
            .replace(/\\lor/g, '∨')
            .replace(/\\neg/g, '¬')
            .replace(/\\rightarrow/g, '→')
            .replace(/\\leftrightarrow/g, '↔')
            .replace(/\\/g, ''); // Remove barras extras
        
        console.log('Fórmula processada:', processed);
        
        return {
            original: this.formula,
            processed: processed,
            type: this.detectFormulaType(processed)
        };
    }

    detectFormulaType(formula) {
        if (formula.includes('∀') || formula.includes('∃')) {
            return 'first-order';
        }
        return 'propositional';
    }
}


class FormulaTransformer {
    constructor(parsedFormula) {
        this.formula = parsedFormula;
        this.steps = [];
    }

    /* Métodos principais */
    toPrenexCNF() {
        this.steps = [];
        let current = this.formula.processed;
        
        // Verificar se a fórmula é válida
        if (!current || current.length === 0) {
            throw new Error('Fórmula inválida');
        }
        
        this.steps.push({
            description: "Fórmula original",
            formula: current
        });

        try {
            // 1. Eliminar bicondicionais
            if (current.includes('↔')) {
                current = this.eliminateBiconditionals(current);
                this.steps.push({
                    description: "Eliminar bicondicionais (P↔Q ≡ (P→Q)∧(Q→P))",
                    formula: current
                });
            }

            // 2. Eliminar implicações
            if (current.includes('→')) {
                current = this.eliminateImplications(current);
                this.steps.push({
                    description: "Eliminar implicações (P→Q ≡ ¬P∨Q)",
                    formula: current
                });
            }

            // 3. Mover negações para dentro (Lei de De Morgan)
            if (current.includes('¬(')) {
                current = this.pushNegations(current);
                this.steps.push({
                    description: "Aplicar Lei de De Morgan",
                    formula: current
                });
            }

            // 4. Mover quantificadores para fora (Prenex) - apenas se for lógica de primeira ordem
            if (this.formula.type === 'first-order' && (current.includes('∀') || current.includes('∃'))) {
                current = this.toPrenex(current);
                this.steps.push({
                    description: "Mover quantificadores para o início (Forma Prenex)",
                    formula: current
                });
            }

            // 5. Distribuir ∨ sobre ∧ (CNF) - simplificado
            if (current.includes('∨') && current.includes('∧')) {
                const cnfAttempt = this.toCNF(current);
                if (cnfAttempt !== current) {
                    current = cnfAttempt;
                    this.steps.push({
                        description: "Distribuir ∨ sobre ∧ (Forma Normal Conjuntiva)",
                        formula: current
                    });
                }
            }
        } catch (e) {
            console.error('Erro durante transformação CNF:', e);
        }

        return {
            steps: this.steps,
            final: current
        };
    }

    toPrenexDNF() {
        this.steps = [];
        let current = this.formula.processed;
        
        // Verificar se a fórmula é válida
        if (!current || current.length === 0) {
            throw new Error('Fórmula inválida');
        }
        
        this.steps.push({
            description: "Fórmula original",
            formula: current
        });

        try {
            // 1. Eliminar bicondicionais
            if (current.includes('↔')) {
                current = this.eliminateBiconditionals(current);
                this.steps.push({
                    description: "Eliminar bicondicionais",
                    formula: current
                });
            }

            // 2. Eliminar implicações
            if (current.includes('→')) {
                current = this.eliminateImplications(current);
                this.steps.push({
                    description: "Eliminar implicações",
                    formula: current
                });
            }

            // 3. Mover negações para dentro
            if (current.includes('¬(')) {
                current = this.pushNegations(current);
                this.steps.push({
                    description: "Aplicar Lei de De Morgan",
                    formula: current
                });
            }

            // 4. Mover quantificadores para fora (Prenex)
            if (this.formula.type === 'first-order' && (current.includes('∀') || current.includes('∃'))) {
                current = this.toPrenex(current);
                this.steps.push({
                    description: "Mover quantificadores para o início (Forma Prenex)",
                    formula: current
                });
            }

            // 5. Distribuir ∧ sobre ∨ (DNF) - simplificado
            if (current.includes('∨') && current.includes('∧')) {
                const dnfAttempt = this.toDNF(current);
                if (dnfAttempt !== current) {
                    current = dnfAttempt;
                    this.steps.push({
                        description: "Distribuir ∧ sobre ∨ (Forma Normal Disjuntiva)",
                        formula: current
                    });
                }
            }
        } catch (e) {
            console.error('Erro durante transformação DNF:', e);
        }

        return {
            steps: this.steps,
            final: current
        };
    }

    toClausalForm() {
        try {
            // Primeiro obter CNF
            const cnfResult = this.toPrenexCNF();
            let current = cnfResult.final;
            
            this.steps = [];
            this.steps.push({
                description: "Forma Normal Conjuntiva",
                formula: current
            });

            // Skolemização (se houver quantificadores existenciais)
            if (this.formula.type === 'first-order' && current.includes('∃')) {
                current = this.skolemize(current);
                this.steps.push({
                    description: "Skolemização (eliminar ∃)",
                    formula: current
                });
            }

            // Remover quantificadores universais
            if (current.includes('∀')) {
                current = current.replace(/∀\w+\s*/g, '');
                this.steps.push({
                    description: "Remover quantificadores universais",
                    formula: current
                });
            }

            // Converter para conjunto de cláusulas
            const clauses = this.extractClauses(current);
            if (clauses.length > 0) {
                this.steps.push({
                    description: "Conjunto de cláusulas",
                    formula: clauses.join(' ∧ ')
                });
            }

            return {
                steps: this.steps,
                final: clauses
            };
        } catch (e) {
            console.error('Erro em forma clausal:', e);
            return {
                steps: [{
                    description: "Erro",
                    formula: "Não foi possível converter para forma clausal"
                }],
                final: []
            };
        }
    }

    toHornClauses() {
        try {
            const clausalResult = this.toClausalForm();
            const clauses = clausalResult.final;
            
            this.steps = [];
            const hornClauses = [];
            const nonHornClauses = [];

            if (clauses && clauses.length > 0) {
                clauses.forEach(clause => {
                    if (this.isHornClause(clause)) {
                        hornClauses.push(clause);
                    } else {
                        nonHornClauses.push(clause);
                    }
                });
            }

            this.steps.push({
                description: "Cláusulas de Horn identificadas",
                formula: hornClauses.length > 0 ? hornClauses.join(' ∧ ') : "Nenhuma cláusula de Horn"
            });

            if (nonHornClauses.length > 0) {
                this.steps.push({
                    description: "Cláusulas não-Horn",
                    formula: nonHornClauses.join(' ∧ ')
                });
            }

            return {
                steps: this.steps,
                hornClauses: hornClauses,
                nonHornClauses: nonHornClauses
            };
        } catch (e) {
            console.error('Erro em Horn:', e);
            return {
                steps: [{
                    description: "Erro",
                    formula: "Não foi possível identificar cláusulas de Horn"
                }],
                hornClauses: [],
                nonHornClauses: []
            };
        }
    }

    /* Métodos Auxiliares */
    eliminateBiconditionals(formula) {
        // Simplificar: apenas substituir o símbolo por enquanto
        while (formula.includes('↔')) {
            formula = formula.replace(/([^↔()]+)↔([^↔()]+)/, '(($1→$2)∧($2→$1))');
        }
        return formula;
    }

    eliminateImplications(formula) {
        // Simplificar: apenas substituir o símbolo
        while (formula.includes('→')) {
            formula = formula.replace(/([^→()]+)→([^→()]+)/, '(¬$1∨$2)');
        }
        return formula;
    }

    pushNegations(formula) {
        let changed = true;
        let iterations = 0;
        while (changed && iterations < 10) {
            changed = false;
            iterations++;
            const oldFormula = formula;
            
            // De Morgan para ¬(P∧Q) = ¬P∨¬Q
            formula = formula.replace(/¬\(([^()]+)∧([^()]+)\)/g, (match, p1, p2) => {
                changed = true;
                return `(¬${p1}∨¬${p2})`;
            });
            
            // De Morgan para ¬(P∨Q) = ¬P∧¬Q
            formula = formula.replace(/¬\(([^()]+)∨([^()]+)\)/g, (match, p1, p2) => {
                changed = true;
                return `(¬${p1}∧¬${p2})`;
            });
            
            // Eliminar dupla negação
            formula = formula.replace(/¬¬/g, '');
            if (oldFormula !== formula) changed = true;
        }
        return formula;
    }

    toPrenex(formula) {
        // Simplificação: mover quantificadores para o início
        const quantifiers = [];
        let matrix = formula;
        
        // Extrair quantificadores
        const quantPattern = /(∀|∃)(\w+)/g;
        let match;
        const foundQuantifiers = [];
        
        while ((match = quantPattern.exec(formula)) !== null) {
            foundQuantifiers.push(match[0]);
        }
        
        // Remover quantificadores da matriz
        foundQuantifiers.forEach(q => {
            matrix = matrix.replace(q, '');
        });
        
        matrix = matrix.trim();
        
        if (foundQuantifiers.length > 0) {
            return foundQuantifiers.join(' ') + ' ' + matrix;
        }
        return formula;
    }

    toCNF(formula) {
        // Distribuir ∨ sobre ∧
        // (P∨(Q∧R)) = (P∨Q)∧(P∨R)
        let changed = true;
        let iterations = 0;
        const maxIterations = 20; // Prevenir loop infinito
        
        while (changed && iterations < maxIterations) {
            changed = false;
            iterations++;
            const oldFormula = formula;
            
            // Padrão: A∨(B∧C) → (A∨B)∧(A∨C)
            formula = formula.replace(/([^∨∧()]+)∨\(([^()]+)∧([^()]+)\)/g, (match, a, b, c) => {
                changed = true;
                return `((${a.trim()}∨${b.trim()})∧(${a.trim()}∨${c.trim()}))`;
            });
            
            // Padrão: (A∧B)∨C → (A∨C)∧(B∨C)
            if (!changed) {
                formula = formula.replace(/\(([^()]+)∧([^()]+)\)∨([^∧∨()]+)/g, (match, a, b, c) => {
                    changed = true;
                    return `((${a.trim()}∨${c.trim()})∧(${b.trim()}∨${c.trim()}))`;
                });
            }
        }
        
        return formula;
    }

    toDNF(formula) {
        // Distribuir ∧ sobre ∨
        // (P∧(Q∨R)) = (P∧Q)∨(P∧R)
        let changed = true;
        let iterations = 0;
        const maxIterations = 20; // Prevenir loop infinito
        
        while (changed && iterations < maxIterations) {
            changed = false;
            iterations++;
            
            // Padrão: A∧(B∨C) → (A∧B)∨(A∧C)
            formula = formula.replace(/([^∨∧()]+)∧\(([^()]+)∨([^()]+)\)/g, (match, a, b, c) => {
                changed = true;
                return `((${a.trim()}∧${b.trim()})∨(${a.trim()}∧${c.trim()}))`;
            });
            
            // Padrão: (A∨B)∧C → (A∧C)∨(B∧C)
            if (!changed) {
                formula = formula.replace(/\(([^()]+)∨([^()]+)\)∧([^∨∧()]+)/g, (match, a, b, c) => {
                    changed = true;
                    return `((${a.trim()}∧${c.trim()})∨(${b.trim()}∧${c.trim()}))`;
                });
            }
        }
        
        return formula;
    }

    skolemize(formula) {
        // Substituir variáveis existenciais por funções/constantes de Skolem
        let result = formula;
        let skolemCounter = 1;
        
        // Encontrar e substituir cada quantificador existencial
        while (result.includes('∃')) {
            result = result.replace(/∃(\w+)/, (match, variable) => {
                const skolemConst = `sk${skolemCounter++}`;
                // Substituir todas as ocorrências da variável
                const regex = new RegExp(`\\b${variable}\\b`, 'g');
                result = result.replace(regex, skolemConst);
                return ''; // Remover o quantificador
            });
        }
        
        return result;
    }

    extractClauses(formula) {
        // Extrair cláusulas individuais de uma CNF
        const clauses = [];
        
        // Remover parênteses externos e dividir por ∧
        formula = formula.replace(/^\(|\)$/g, '');
        const parts = formula.split(/∧/);
        
        parts.forEach(part => {
            const cleaned = part.trim().replace(/^\(|\)$/g, '');
            if (cleaned) {
                clauses.push(`{${cleaned.replace(/∨/g, ', ')}}`);
            }
        });
        
        return clauses;
    }

    isHornClause(clause) {
        // Uma cláusula de Horn tem no máximo um literal positivo
        const literals = clause.replace(/[{}]/g, '').split(',').map(l => l.trim());
        let positiveCount = 0;
        
        literals.forEach(literal => {
            if (!literal.startsWith('¬')) {
                positiveCount++;
            }
        });
        
        return positiveCount <= 1;
    }
}


/* Funções da Interface */
function processFormula() {
    const input = document.getElementById('formulaInput').value.trim();
    
    if (!input) {
        showError('Por favor, digite uma fórmula válida.');
        return;
    }

    const loader = document.getElementById('loader');
    const results = document.getElementById('results');
    
    loader.classList.add('active');
    results.innerHTML = '';

    // Renderizar fórmula com MathJax (não bloquear se falhar)
    try {
        renderFormula(input);
    } catch (e) {
        console.warn('Erro ao renderizar fórmula com MathJax:', e);
    }

    // Usar timeout para prevenir travamento da UI
    setTimeout(() => {
        try {
            console.log('Iniciando processamento da fórmula:', input);
            
            // Parse da fórmula
            const parser = new FormulaParser(input);
            const parsed = parser.parse();
            
            console.log('Fórmula parseada:', parsed);
            
            // Para fórmulas complexas, simplificar o processamento
            if (parsed.type === 'first-order' && parsed.processed.length > 100) {
                // Processar apenas forma básica para fórmulas muito complexas
                displaySimplifiedResult(parsed);
            } else {
                // Criar transformador
                const transformer = new FormulaTransformer(parsed);
                
                // Gerar todas as formas normais com timeout
                try {
                    console.log('Gerando CNF...');
                    const cnfResult = transformer.toPrenexCNF();
                    displayResult('Forma Normal Conjuntiva Prenex (PCNF)', cnfResult);
                } catch (e) {
                    console.error('Erro em CNF:', e);
                    showError('Erro ao gerar CNF: ' + e.message);
                }
                
                try {
                    console.log('Gerando DNF...');
                    const dnfResult = transformer.toPrenexDNF();
                    displayResult('Forma Normal Disjuntiva Prenex (PDNF)', dnfResult);
                } catch (e) {
                    console.error('Erro em DNF:', e);
                    showError('Erro ao gerar DNF: ' + e.message);
                }
                
                try {
                    console.log('Gerando forma clausal...');
                    const clausalResult = transformer.toClausalForm();
                    displayResult('Forma Clausal', clausalResult);
                } catch (e) {
                    console.error('Erro em Clausal:', e);
                    showError('Erro ao gerar forma clausal: ' + e.message);
                }
                
                try {
                    console.log('Identificando cláusulas de Horn...');
                    const hornResult = transformer.toHornClauses();
                    displayHornResult('Cláusulas de Horn', hornResult);
                } catch (e) {
                    console.error('Erro em Horn:', e);
                    showError('Erro ao identificar cláusulas de Horn: ' + e.message);
                }
            }
            
            console.log('Processamento concluído!');
            
        } catch (error) {
            console.error('Erro geral:', error);
            showError(error.message || 'Erro ao processar a fórmula. Tente uma fórmula mais simples.');
        } finally {
            loader.classList.remove('active');
        }
    }, 100);
}

function displaySimplifiedResult(parsed) {
    const resultsDiv = document.getElementById('results');
    
    const card = document.createElement('div');
    card.className = 'result-card';
    
    card.innerHTML = `
        <div class="result-title">Análise da Fórmula</div>
        <div class="step">
            <div class="step-number">Tipo de Fórmula</div>
            <div class="formula-display">
                ${parsed.type === 'first-order' ? 'Lógica de Primeira Ordem' : 'Lógica Proposicional'}
            </div>
        </div>
        <div class="step">
            <div class="step-number">Fórmula Processada</div>
            <div class="formula-display">${formatFormula(parsed.processed)}</div>
        </div>
        <div class="error-message">
            Fórmula muito complexa para transformação completa. 
            Tente uma fórmula mais simples para ver todas as transformações.
        </div>
    `;
    
    resultsDiv.appendChild(card);
}

function renderFormula(latex) {
    const container = document.getElementById('renderedFormula');
    container.style.display = 'flex';
    container.innerHTML = `$$${latex}$$`;
    
    // Verificar se MathJax está disponível e usar a API correta
    if (window.MathJax && window.MathJax.typesetPromise) {
        MathJax.typesetPromise([container]).catch((e) => {
            console.error('Erro ao renderizar LaTeX:', e);
        });
    } else if (window.MathJax && window.MathJax.typeset) {
        // Fallback para versão diferente do MathJax
        try {
            MathJax.typeset([container]);
        } catch (e) {
            console.error('Erro ao renderizar LaTeX:', e);
        }
    } else if (window.MathJax && window.MathJax.Hub) {
        // Fallback para MathJax v2
        MathJax.Hub.Queue(["Typeset", MathJax.Hub, container]);
    } else {
        console.warn('MathJax não está totalmente carregado');
    }
}

function displayResult(title, result) {
    console.log('Exibindo resultado:', title, result);
    const resultsDiv = document.getElementById('results');
    
    if (!resultsDiv) {
        console.error('Div de resultados não encontrada!');
        return;
    }
    
    const card = document.createElement('div');
    card.className = 'result-card';
    
    let html = `<div class="result-title">${title}</div>`;
    
    if (result.steps && result.steps.length > 0) {
        result.steps.forEach((step, index) => {
            html += `
                <div class="step">
                    <div class="step-number">Passo ${index + 1}</div>
                    <div>${step.description}</div>
                    <div class="formula-display">${formatFormula(step.formula)}</div>
                </div>
            `;
        });
    }
    
    if (result.final) {
        html += `
            <div class="step" style="background: #e6fffa; border-left-color: #48bb78;">
                <div class="step-number" style="color: #48bb78;">Resultado Final</div>
                <div class="formula-display" style="font-weight: bold;">
                    ${Array.isArray(result.final) ? result.final.join('<br>') : formatFormula(result.final)}
                </div>
            </div>
        `;
    }
    
    card.innerHTML = html;
    resultsDiv.appendChild(card);
    console.log('Resultado adicionado ao DOM');
}

function displayHornResult(title, result) {
    const resultsDiv = document.getElementById('results');
    
    const card = document.createElement('div');
    card.className = 'result-card';
    
    let html = `<div class="result-title">${title}</div>`;
    
    if (result.hornClauses && result.hornClauses.length > 0) {
        html += `
            <div class="step" style="background: #e6fffa; border-left-color: #48bb78;">
                <div class="step-number" style="color: #48bb78;">
                    Cláusulas de Horn 
                    <span class="info-badge">${result.hornClauses.length} encontrada(s)</span>
                </div>
                <div class="formula-display">
                    ${result.hornClauses.join('<br>')}
                </div>
            </div>
        `;
    } else {
        html += `
            <div class="step">
                <div class="step-number">Resultado</div>
                <div>Nenhuma cláusula de Horn encontrada na fórmula.</div>
            </div>
        `;
    }
    
    if (result.nonHornClauses && result.nonHornClauses.length > 0) {
        html += `
            <div class="step" style="background: #fed7d7; border-left-color: #f56565;">
                <div class="step-number" style="color: #f56565;">
                    Cláusulas não-Horn 
                    <span class="info-badge" style="background: #f56565;">
                        ${result.nonHornClauses.length} encontrada(s)
                    </span>
                </div>
                <div class="formula-display">
                    ${result.nonHornClauses.join('<br>')}
                </div>
            </div>
        `;
    }
    
    card.innerHTML = html;
    resultsDiv.appendChild(card);
}

function formatFormula(formula) {
    // Converter símbolos internos para apresentação
    return formula
        .replace(/∀/g, '∀')
        .replace(/∃/g, '∃')
        .replace(/∧/g, ' ∧ ')
        .replace(/∨/g, ' ∨ ')
        .replace(/¬/g, '¬')
        .replace(/→/g, ' → ')
        .replace(/↔/g, ' ↔ ');
}

function showError(message) {
    console.error('Exibindo erro:', message);
    const results = document.getElementById('results');
    if (!results) {
        console.error('Div de resultados não encontrada para exibir erro!');
        alert(message); // Fallback para alert
        return;
    }
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `<strong>⚠️ Erro:</strong> ${message}`;
    results.appendChild(errorDiv);
}

function setFormula(formula) {
    document.getElementById('formulaInput').value = formula;
}

function loadExample() {
    const examples = [
        'P \\land Q',
        'P \\lor Q',
        'P \\rightarrow Q',
        '\\neg P',
        'P \\leftrightarrow Q'
    ];
    
    const randomExample = examples[Math.floor(Math.random() * examples.length)];
    console.log('Carregando exemplo:', randomExample);
    setFormula(randomExample);
}

function clearAll() {
    document.getElementById('formulaInput').value = '';
    document.getElementById('results').innerHTML = '';
    document.getElementById('renderedFormula').style.display = 'none';
    console.log('Tudo limpo!');
}


/* Inicialização e Event Listeners */
// Adicionar suporte para Enter após o DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('formulaInput');
    if (input) {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                processFormula();
            }
        });
        console.log('Event listener adicionado ao input');
    } else {
        console.error('Input não encontrado!');
    }
});

// Verificação inicial ao carregar
window.onload = function() {
    console.log('=== INICIALIZAÇÃO DO SISTEMA ===');
    
    // Verificar elementos essenciais
    const elements = {
        input: document.getElementById('formulaInput'),
        results: document.getElementById('results'),
        loader: document.getElementById('loader'),
        renderedFormula: document.getElementById('renderedFormula')
    };
    
    let allOk = true;
    for (let [name, element] of Object.entries(elements)) {
        if (!element) {
            console.error(`Elemento ${name} não encontrado!`);
            allOk = false;
        } else {
            console.log(`✓ Elemento ${name} OK`);
        }
    }
    
    if (allOk) {
        console.log('✓ Todos os elementos encontrados');
        console.log('✓ Sistema pronto!');
        
        // Adicionar mensagem inicial
        const results = document.getElementById('results');
        if (results && results.innerHTML === '') {
            results.innerHTML = `
                <div class="result-card" style="text-align: center; color: #667eea;">
                    <p style="font-size: 1.2em;">👋 Sistema pronto!</p>
                    <p>Digite uma fórmula ou clique em "Carregar Exemplo" para começar.</p>
                </div>
            `;
        }
    } else {
        alert('Erro ao carregar o sistema. Verifique o console.');
    }
};
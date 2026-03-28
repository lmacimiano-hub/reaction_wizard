let loopPrincipal, relogioSessao;
let tempoRestante = 0, totalEstimulos = 0;
let ultimoSorteado = "", contadorRepeticao = 0;
let mapaLegendas = {}, filaSequencia = [], indiceSequencia = 0;
let modoAtual = "aleatorio";
let sequenciasSalvas = JSON.parse(localStorage.getItem('wizardSavedSeqs') || '{}');

const dadosEstimulos = {
    cores: ["VERMELHO", "VERDE", "AZUL", "ROXO"],
    setas: ["↑", "↓", "←", "→", "↗", "↖", "↘", "↙"],
    numeros: ["1", "2", "3", "4", "5", "6"],
    sons: ["sons/alarme_relogio.mp3", "sons/celular.mp3", "sons/gaita_1.mp3", "sons/martelada.mp3", "sons/sino.mp3", "sons/sirene.mp3", "sons/tiro.mp3"]
};

window.onload = carregarHistorico;

function irParaSetup(modo) {
    modoAtual = modo;
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('setup-screen').style.display = 'block';
    const isSeq = (modo === 'sequencia');
    document.getElementById('sequence-builder').style.display = isSeq ? 'block' : 'none';
    document.getElementById('random-option').style.display = isSeq ? 'none' : 'block';
    if (isSeq) renderizarSequenciasSalvas();
    limparSequencia();
    renderizarSelecao();
}

function voltarParaMenu() { document.getElementById('setup-screen').style.display = 'none'; document.getElementById('home-screen').style.display = 'flex'; }
function toggleHelp() { const modal = document.getElementById('help-modal'); modal.style.display = (modal.style.display === "block") ? "none" : "block"; }
function nomeSom(c) { const m = {"sons/alarme_relogio.mp3":"ALARME","sons/celular.mp3":"CELULAR","sons/gaita_1.mp3":"GAITA","sons/martelada.mp3":"MARTELADA","sons/sino.mp3":"SINO","sons/sirene.mp3":"SIRENE","sons/tiro.mp3":"TIRO"}; return m[c] || "SOM"; }

function renderizarSelecao() {
    const grid = (id, list, name) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = list.map(item => {
            const label = item.includes('.mp3') ? nomeSom(item) : item;
            return modoAtual === 'aleatorio' 
                ? `<label><input type="checkbox" name="${name}" value="${item}" onchange="atualizarEntradasLegenda()"> ${label}</label>`
                : `<div class="stim-btn-select" onclick="adicionarAFila('${item}')">${label}</div>`;
        }).join('');
    };
    grid('grid-cores', dadosEstimulos.cores, 'stim');
    grid('grid-setas', dadosEstimulos.setas, 'stim-arrow');
    grid('grid-numeros', dadosEstimulos.numeros, 'stim-number');
    grid('grid-sons', dadosEstimulos.sons, 'sound-stim');
}

function adicionarAFila(i) { filaSequencia.push(i); atualizarFilaVisual(); atualizarEntradasLegenda(); }
function limparSequencia() { filaSequencia = []; atualizarFilaVisual(); atualizarEntradasLegenda(); }
function atualizarFilaVisual() { document.getElementById('sequence-queue').innerHTML = filaSequencia.map((i, idx) => `<div class="queue-item" onclick="removerDaFila(${idx})">${i.includes('.mp3')?nomeSom(i):i} ✕</div>`).join(''); }
function removerDaFila(idx) { filaSequencia.splice(idx, 1); atualizarFilaVisual(); atualizarEntradasLegenda(); }

function salvarSequenciaAtual() {
    const n = document.getElementById('new-sequence-name').value.trim();
    if (!n || filaSequencia.length === 0) return alert("Defina um nome.");
    sequenciasSalvas[n] = [...filaSequencia];
    localStorage.setItem('wizardSavedSeqs', JSON.stringify(sequenciasSalvas));
    document.getElementById('new-sequence-name').value = "";
    renderizarSequenciasSalvas();
}

function renderizarSequenciasSalvas() {
    const c = document.getElementById('saved-sequences-list');
    const nomes = Object.keys(sequenciasSalvas);
    c.innerHTML = nomes.length === 0 ? "<p style='font-size:0.7em; color:#666;'>Vazio</p>" : nomes.map(n => `<div class="saved-seq-item"><span onclick="carregarSequencia('${n}')">${n}</span><button class="btn-del-seq" onclick="excluirSequencia('${n}')">&times;</button></div>`).join('');
}

function carregarSequencia(n) { filaSequencia = [...sequenciasSalvas[n]]; atualizarFilaVisual(); atualizarEntradasLegenda(); }
function excluirSequencia(n) { if(confirm("Excluir?")) { delete sequenciasSalvas[n]; localStorage.setItem('wizardSavedSeqs', JSON.stringify(sequenciasSalvas)); renderizarSequenciasSalvas(); } }

function alternarSetupLegenda() {
    const a = document.getElementById('enable-legend').checked;
    document.getElementById('legend-setup-container').style.display = a ? 'block' : 'none';
    if (a) atualizarEntradasLegenda();
}

function atualizarEntradasLegenda() {
    if (!document.getElementById('enable-legend').checked) return;
    const c = document.getElementById('legend-inputs');
    const sel = modoAtual === 'aleatorio' 
        ? [...Array.from(document.querySelectorAll('input[name="stim"]:checked, input[name="stim-arrow"]:checked, input[name="stim-number"]:checked, input[name="sound-stim"]:checked'))].map(i => i.value)
        : [...new Set(filaSequencia)];

    const old = {}; c.querySelectorAll('input').forEach(i => old[i.dataset.id] = i.value);
    c.innerHTML = sel.map(id => `<div><label>${id.includes('.mp3')?nomeSom(id):id}</label><input type="text" data-id="${id}" value="${old[id]||""}" placeholder="Movimento..."></div>`).join('');
}

function prepararSessao() {
    const pool = modoAtual === 'aleatorio' ? [...Array.from(document.querySelectorAll('input[name="stim"]:checked, input[name="stim-arrow"]:checked, input[name="stim-number"]:checked, input[name="sound-stim"]:checked'))].map(i => i.value) : [...filaSequencia];
    if (pool.length === 0) return alert("Selecione estímulos.");
    
    mapaLegendas = {};
    if (document.getElementById('enable-legend').checked) {
        document.querySelectorAll('#legend-inputs input').forEach(i => mapaLegendas[i.dataset.id] = i.value);
    }

    document.getElementById('setup-screen').style.display = 'none';
    const trainingScreen = document.getElementById('training-screen');
    trainingScreen.style.display = 'flex';
    
    const v = document.getElementById('intro-video');
    const d = document.getElementById('display-area');
    d.style.display = 'none';
    v.style.display = 'block';
    
    v.play().catch(() => v.onended()); // Garante início se o autoplay falhar
    v.onended = () => {
        v.style.display = 'none';
        d.style.display = 'flex';
        iniciarTreino(pool);
    };
}

function iniciarTreino(p) {
    const dur = parseFloat(document.getElementById('stim-dur').value)*1000, int = parseFloat(document.getElementById('base-int').value)*1000;
    tempoRestante = parseInt(document.getElementById('total-time').value); totalEstimulos = 0; indiceSequencia = 0;
    
    relogioSessao = setInterval(() => {
        tempoRestante--;
        document.getElementById('timer-display').innerText = `${tempoRestante} segundos`;
        if (tempoRestante <= 0) encerrarSessao(true);
    }, 1000);
    cicloDeReacao(p, dur, int);
}

function cicloDeReacao(p, dur, inter) {
    if (tempoRestante <= 0) return;
    let esp = (modoAtual === 'aleatorio' && document.getElementById('random-mode').checked) ? inter * (Math.random() * 0.8 + 0.7) : inter;
    
    loopPrincipal = setTimeout(() => {
        const d = document.getElementById('display-area'), l = document.getElementById('dynamic-label');
        d.classList.remove('strokeme'); d.style.background = "transparent"; l.style.visibility = "hidden";
        
        let s = modoAtual === 'aleatorio' ? p[Math.floor(Math.random()*p.length)] : p[indiceSequencia];
        if (modoAtual === 'aleatorio' && p.length > 1 && s === ultimoSorteado && ++contadorRepeticao > 3) {
            s = p.filter(i => i !== s)[Math.floor(Math.random()*(p.length-1))];
            contadorRepeticao = 1;
        } else if (modoAtual === 'sequencia') {
            indiceSequencia = (indiceSequencia + 1) % p.length;
        }
        
        ultimoSorteado = s; totalEstimulos++;
        if (s.includes('.mp3')) { new Audio(s).play(); d.innerText = nomeSom(s); d.classList.add('strokeme'); }
        else if (dadosEstimulos.setas.includes(s) || dadosEstimulos.numeros.includes(s)) { d.innerText = s; d.classList.add('strokeme'); }
        else { d.style.background = {"VERMELHO":"#e74c3c","VERDE":"#2ecc71","AZUL":"#3498db","ROXO":"#8a2be2"}[s]; d.innerText = ""; }
        
        if (mapaLegendas[s]) { l.innerText = mapaLegendas[s]; l.style.visibility = "visible"; }
        document.getElementById('counter-display').innerText = `Estímulos: ${totalEstimulos}`;
        
        setTimeout(() => {
            d.innerText = ""; d.style.background = "transparent"; l.style.visibility = "hidden";
            if (tempoRestante > 0) cicloDeReacao(p, dur, inter);
        }, dur);
    }, esp);
}

function encerrarSessao(f) {
    clearTimeout(loopPrincipal); clearInterval(relogioSessao);
    if (f) alert("Fim da Sessão!");
    document.getElementById('training-screen').style.display = 'none';
    document.getElementById('home-screen').style.display = 'flex';
    carregarHistorico();
}

function carregarHistorico() { /* Mantenha sua lógica de histórico aqui */ }
function limparHistorico() { if(confirm("Limpar?")) { localStorage.removeItem('wizardHistoryPro'); carregarHistorico(); } }
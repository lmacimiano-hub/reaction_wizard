let loopPrincipal, relogioSessao;
let tempoRestante = 0, totalEstimulos = 0;
let ultimoSorteado = "", contadorRepeticao = 0;
let mapaLegendas = {};

window.onload = carregarHistorico;

function toggleHelp() {
    const modal = document.getElementById('help-modal');
    modal.style.display = (modal.style.display === "block") ? "none" : "block";
}

function nomeSom(c) {
    const m = {
        "sons/alarme_relogio.mp3":"ALARME", "sons/celular.mp3":"CELULAR",
        "sons/tiro.mp3":"TIRO", "sons/sino.mp3":"SINO",
        "sons/gaita_1.mp3":"GAITA", "sons/martelada.mp3":"MARTELADA",
        "sons/sirene.mp3":"SIRENE"
    };
    return m[c] || "SOM";
}

function alternarSetupLegenda() {
    const a = document.getElementById('enable-legend').checked;
    document.getElementById('legend-setup-container').style.display = a ? 'block' : 'none';
    if (a) atualizarEntradasLegenda();
}

function atualizarEntradasLegenda() {
    if (!document.getElementById('enable-legend').checked) return;
    const c = document.getElementById('legend-inputs');
    const sel = [...Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))]
                .filter(i => i.id !== 'enable-legend' && i.id !== 'random-mode')
                .map(i => i.value);
    const old = {}; c.querySelectorAll('input').forEach(i => old[i.dataset.id] = i.value);
    c.innerHTML = sel.map(id => `<div><label>${id.includes('.mp3')?nomeSom(id):id}</label><input type="text" data-id="${id}" value="${old[id]||""}" placeholder="..."></div>`).join('');
}

function prepararSessao() {
    const pool = [...Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))]
                .filter(i => i.id !== 'enable-legend' && i.id !== 'random-mode').map(i => i.value);
                
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
    
    // Tenta tocar o vídeo; se houver erro ou ausência de arquivo, inicia treino após 1s
    v.play().catch(() => {
        setTimeout(() => {
            v.style.display = 'none';
            d.style.display = 'flex';
            iniciarTreino(pool);
        }, 1000);
    });

    v.onended = () => {
        v.style.display = 'none';
        d.style.display = 'flex';
        iniciarTreino(pool);
    };
}

function iniciarTreino(p) {
    const dur = parseFloat(document.getElementById('stim-dur').value)*1000;
    const int = parseFloat(document.getElementById('base-int').value)*1000;
    tempoRestante = parseInt(document.getElementById('total-time').value); totalEstimulos = 0;
    document.getElementById('timer-display').innerText = `${tempoRestante} s`;
    relogioSessao = setInterval(() => {
        tempoRestante--; document.getElementById('timer-display').innerText = `${tempoRestante} s`;
        if (tempoRestante <= 0) encerrarSessao(true);
    }, 1000);
    cicloDeReacao(p, dur, int);
}

function cicloDeReacao(p, dur, inter) {
    if (tempoRestante <= 0) return;
    let esp = document.getElementById('random-mode').checked ? inter * (Math.random() * 0.8 + 0.7) : inter;
    loopPrincipal = setTimeout(() => {
        const d = document.getElementById('display-area'), l = document.getElementById('dynamic-label');
        d.classList.remove('strokeme'); d.style.background = "transparent"; l.style.visibility = "hidden";
        let s = p[Math.floor(Math.random()*p.length)];
        if (p.length > 1 && s === ultimoSorteado && ++contadorRepeticao > 3) {
            s = p.filter(i => i !== s)[Math.floor(Math.random()*(p.length-1))]; contadorRepeticao = 1;
        }
        ultimoSorteado = s; totalEstimulos++;
        if (s.includes('.mp3')) { new Audio(s).play(); d.innerText = nomeSom(s); d.classList.add('strokeme'); }
        else if (["↑","↓","←","→","↗","↖","↘","↙"].includes(s) || !isNaN(s)) { d.innerText = s; d.classList.add('strokeme'); }
        else { d.style.background = {"VERMELHO":"#e74c3c","VERDE":"#2ecc71","AZUL":"#3498db","ROXO":"#8a2be2"}[s]; d.innerText = ""; }
        if (mapaLegendas[s]) { l.innerText = mapaLegendas[s]; l.style.visibility = "visible"; }
        document.getElementById('counter-display').innerText = `Estímulos: ${totalEstimulos}`;
        setTimeout(() => { d.innerText = ""; d.style.background = "transparent"; d.classList.remove('strokeme'); l.style.visibility = "hidden"; if (tempoRestante > 0) cicloDeReacao(p, dur, inter); }, dur);
    }, esp);
}

function encerrarSessao(f) {
    clearTimeout(loopPrincipal); clearInterval(relogioSessao); if (f) alert("Fim da Sessão!");
    const logs = JSON.parse(localStorage.getItem('wizardHistoryPro') || '[]');
    logs.unshift({ data: new Date().toLocaleDateString('pt-BR'), total: totalEstimulos });
    localStorage.setItem('wizardHistoryPro', JSON.stringify(logs.slice(0, 5)));
    carregarHistorico(); document.getElementById('training-screen').style.display = 'none'; document.getElementById('setup-screen').style.display = 'flex';
}

function carregarHistorico() {
    const l = JSON.parse(localStorage.getItem('wizardHistoryPro') || '[]');
    const el = document.getElementById('history-list');
    if (el) el.innerHTML = l.map(i => `<div class="history-item"><strong>${i.data}</strong>: ${i.total} est.</div>`).join('');
}

function limparHistorico() { if(confirm("Limpar histórico?")) { localStorage.removeItem('wizardHistoryPro'); carregarHistorico(); } }
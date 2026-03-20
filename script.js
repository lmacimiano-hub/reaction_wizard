let loopPrincipal, relogioSessao;
let tempoRestante = 0, totalEstimulos = 0;
let ultimoSorteado = "", contadorRepeticao = 0;

window.onload = carregarHistorico;

function toggleHelp() {
    const modal = document.getElementById('help-modal');
    modal.style.display = (modal.style.display === "block") ? "none" : "block";
}

function nomeSom(caminho) {
    const mapa = {
        "sons/alarme_relogio.mp3": "ALARME",
        "sons/celular.mp3": "CELULAR",
        "sons/gaita_1.mp3": "GAITA",
        "sons/martelada.mp3": "MARTELADA",
        "sons/sino.mp3": "SINO",
        "sons/sirene.mp3": "SIRENE",
        "sons/tiro.mp3": "TIRO"
    };
    return mapa[caminho] || "SOM";
}

function alternarSetupLegenda() {
    const ativo = document.getElementById('enable-legend').checked;
    document.getElementById('legend-setup-container').style.display = ativo ? 'block' : 'none';
    if (ativo) atualizarEntradasLegenda();
}

function atualizarEntradasLegenda() {
    if (!document.getElementById('enable-legend').checked) return;
    const container = document.getElementById('legend-inputs');
    const selecionados = [
        ...Array.from(document.querySelectorAll('input[name="stim"]:checked')),
        ...Array.from(document.querySelectorAll('input[name="stim-arrow"]:checked')),
        ...Array.from(document.querySelectorAll('input[name="stim-number"]:checked')),
        ...Array.from(document.querySelectorAll('input[name="sound-stim"]:checked'))
    ];
    const valoresAntigos = {};
    container.querySelectorAll('input').forEach(i => valoresAntigos[i.dataset.id] = i.value);
    container.innerHTML = selecionados.map(s => {
        const id = s.value;
        const label = s.name === "sound-stim" ? nomeSom(id) : id;
        return `<div><label>${label}:</label><input type="text" data-id="${id}" value="${valoresAntigos[id] || ""}"></div>`;
    }).join('');
}

function prepararSessao() {
    const v = Array.from(document.querySelectorAll('input[name="stim"]:checked')).map(c => c.value);
    const a = Array.from(document.querySelectorAll('input[name="stim-arrow"]:checked')).map(c => c.value);
    const n = Array.from(document.querySelectorAll('input[name="stim-number"]:checked')).map(c => c.value);
    const s = Array.from(document.querySelectorAll('input[name="sound-stim"]:checked')).map(c => c.value);
    if (![...v, ...a, ...n, ...s].length) return alert("Selecione um estímulo.");

    const legendAtiva = document.getElementById('enable-legend').checked;
    const legendDisplay = document.getElementById('active-legend');
    if (legendAtiva) {
        legendDisplay.innerHTML = Array.from(document.querySelectorAll('#legend-inputs input')).map(i => 
            `<div class="legend-item"><b>${i.previousElementSibling.innerText}</b> ${i.value}</div>`
        ).join('');
        legendDisplay.style.display = 'block';
    } else {
        legendDisplay.style.display = 'none';
    }

    document.getElementById('setup-screen').style.display = 'none';
    const trainingScreen = document.getElementById('training-screen');
    trainingScreen.style.display = 'flex';
    const video = document.getElementById('intro-video');
    video.style.display = 'block';
    video.play();
    video.onended = () => {
        video.style.display = 'none';
        document.getElementById('display-area').style.display = 'flex';
        iniciarTreino(v, a, n, s);
    };
}

function iniciarTreino(v, a, n, s) {
    const dur = parseFloat(document.getElementById('stim-dur').value) * 1000;
    const int = parseFloat(document.getElementById('base-int').value) * 1000;
    tempoRestante = parseInt(document.getElementById('total-time').value);
    totalEstimulos = 0;
    ultimoSorteado = "";
    contadorRepeticao = 0;
    
    document.getElementById('timer-display').innerText = `${tempoRestante} segundos`;
    document.getElementById('counter-display').innerText = `Estímulos: 0`;

    relogioSessao = setInterval(() => {
        tempoRestante--;
        document.getElementById('timer-display').innerText = `${tempoRestante} segundos`;
        if (tempoRestante <= 0) encerrarSessao(true);
    }, 1000);
    cicloDeReacao(v, a, n, s, dur, int);
}

function cicloDeReacao(lv, la, ln, ls, dur, inter) {
    if (tempoRestante <= 0) return;
    const rand = document.getElementById('random-mode').checked;
    let espera = rand ? inter * (Math.random() * (1.5 - 0.7) + 0.7) : inter;
    loopPrincipal = setTimeout(() => {
        const d = document.getElementById('display-area');
        d.classList.remove('strokeme'); d.style.background = "transparent";
        const pool = [...lv, ...la, ...ln, ...ls];
        let sorteado = pool[Math.floor(Math.random() * pool.length)];
        
        if (pool.length > 1 && sorteado === ultimoSorteado) {
            contadorRepeticao++;
            if (contadorRepeticao > 3) {
                sorteado = pool.filter(i => i !== sorteado)[Math.floor(Math.random() * (pool.length - 1))];
                contadorRepeticao = 1;
            }
        } else { contadorRepeticao = 1; }
        
        ultimoSorteado = sorteado;
        totalEstimulos++;
        
        if (sorteado.includes('.mp3')) {
            new Audio(sorteado).play(); d.innerText = nomeSom(sorteado); d.classList.add('strokeme');
        } else if (la.includes(sorteado) || ln.includes(sorteado)) {
            d.innerText = sorteado; d.classList.add('strokeme');
        } else {
            const cores = {"VERMELHO": "#e74c3c", "VERDE": "#2ecc71", "AZUL": "#3498db", "ROXO": "#8a2be2"};
            d.style.background = cores[sorteado] || "transparent"; d.innerText = "";
        }
        document.getElementById('counter-display').innerText = `Estímulos: ${totalEstimulos}`;
        setTimeout(() => {
            d.innerText = ""; d.style.background = "transparent";
            if (tempoRestante > 0) cicloDeReacao(lv, la, ln, ls, dur, inter);
        }, dur);
    }, espera);
}

function encerrarSessao(finalizado) {
    clearTimeout(loopPrincipal); clearInterval(relogioSessao);
    if (finalizado) alert("Treino Finalizado!");
    const logs = JSON.parse(localStorage.getItem('wizardHistoryPro') || '[]');
    logs.unshift({ data: new Date().toLocaleDateString('pt-BR'), total: totalEstimulos });
    localStorage.setItem('wizardHistoryPro', JSON.stringify(logs.slice(0, 5)));
    carregarHistorico();
    document.getElementById('setup-screen').style.display = 'flex';
    document.getElementById('training-screen').style.display = 'none';
}

function carregarHistorico() {
    const logs = JSON.parse(localStorage.getItem('wizardHistoryPro') || '[]');
    document.getElementById('history-list').innerHTML = logs.map(l => 
        `<div class="history-item"><strong>${l.data}</strong>: ${l.total} estímulos</div>`
    ).join('');
}

function limparHistorico() {
    if(confirm("Apagar histórico?")) { localStorage.removeItem('wizardHistoryPro'); carregarHistorico(); }
}
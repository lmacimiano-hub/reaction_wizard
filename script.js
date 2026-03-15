let trainingTimeout;
let sessionInterval;
let lastStimulus = "";
let stimulusCount = 0;
let repeatCount = 0;
let timeLeft = 0;

window.onload = displayHistory;

function startTraining() {
    const durationInput = document.getElementById('stimulus-duration').value;
    const intervalInput = document.getElementById('base-interval').value;
    const sessionInput = document.getElementById('session-time').value;

    const durationVal = parseFloat(durationInput);
    const intervalVal = parseFloat(intervalInput);
    const sessionVal = parseInt(sessionInput);

    const duration = durationVal * 1000;
    const interval = intervalVal * 1000;
    const isRandom = document.getElementById('randomize-interval').checked;
    timeLeft = sessionVal;

    const selected = Array.from(document.querySelectorAll('input[name="stim"]:checked')).map(cb => cb.value);

    // Validações de Regras de Negócio
    if (selected.length < 1) {
        alert("Selecione pelo menos um estímulo");
        return;
    }

    if (durationVal < 0.1) {
        alert("A duração do estímulo deve ser de no mínimo 0,1 segundos");
        return;
    }

    if (intervalVal >= sessionVal) {
        alert("O intervalo entre os estímulos não pode ser maior ou igual ao tempo total da sessão");
        return;
    }

    // Reset de Estado
    stimulusCount = 0;
    repeatCount = 0;
    lastStimulus = "";
    
    document.getElementById('counter').innerText = "Estímulos: 0";
    document.getElementById('timer-display').innerText = `Tempo: ${timeLeft}s`;
    
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('training-screen').style.display = 'flex';

    executarContagem(selected, duration, interval, isRandom);
}

function executarContagem(stimuli, duration, interval, isRandom) {
    const display = document.getElementById('display-area');
    const passos = ["5", "4", "3", "2", "1", "BORA!"];
    let i = 0;

    display.style.background = "transparent";
    display.style.color = "#bb86fc";

    function proximoPasso() {
        if (i < passos.length) {
            display.innerText = passos[i];
            i++;
            setTimeout(proximoPasso, 1000);
        } else {
            display.innerText = "";
            iniciarCronometroSessao();
            runCycle(stimuli, duration, interval, isRandom);
        }
    }
    proximoPasso();
}

function iniciarCronometroSessao() {
    sessionInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timer-display').innerText = `Tempo: ${timeLeft}s`;
        
        if (timeLeft <= 0) {
            stopTraining();
            alert("🪄 Sessão Encerrada!");
        }
    }, 1000);
}

function runCycle(stimuli, duration, interval, isRandom) {
    if (timeLeft <= 0) return;

    const display = document.getElementById('display-area');
    const counterElement = document.getElementById('counter');
    
    // Lógica de Randomização Controlada (0.7x a 1.5x)
    let currentDelay = isRandom ? 
        interval * (Math.random() * (1.5 - 0.7) + 0.7) : 
        interval;

    trainingTimeout = setTimeout(() => {
        let current;
        
        if (stimuli.length === 1) {
            current = stimuli[0];
        } else {
            current = stimuli[Math.floor(Math.random() * stimuli.length)];
            
            // Controle de repetição (Limite de 3)
            if (current === lastStimulus) {
                repeatCount++;
            } else {
                repeatCount = 1;
            }
            if (repeatCount > 3) {
                const options = stimuli.filter(s => s !== current);
                current = options[Math.floor(Math.random() * options.length)];
                repeatCount = 1;
            }
        }

        lastStimulus = current;
        stimulusCount++;
        counterElement.innerText = `Estímulos: ${stimulusCount}`;

        // Mapeamento de Cores e Estilos
        const coresMapeadas = {
            "VERMELHO": "#e74c3c",
            "VERDE": "#2ecc71",
            "AZUL": "#3498db",
            "COR DO BRUXÃO": "#8a2be2"
        };

        if (coresMapeadas[current]) {
            display.innerText = ""; // UX: Não mostra o nome da cor
            display.style.background = coresMapeadas[current];
        } else {
            display.innerText = current; 
            display.style.background = "transparent";
            display.style.color = "#bb86fc"; 
        }

        setTimeout(() => {
            display.innerText = "";
            display.style.background = "transparent";
            if (timeLeft > 0) runCycle(stimuli, duration, interval, isRandom);
        }, duration);

    }, currentDelay);
}

function stopTraining() {
    clearTimeout(trainingTimeout);
    clearInterval(sessionInterval);
    saveSession();
    document.getElementById('setup-screen').style.display = 'flex';
    document.getElementById('training-screen').style.display = 'none';
}

function saveSession() {
    const history = JSON.parse(localStorage.getItem('reactionHistory') || '[]');
    const durValue = document.getElementById('stimulus-duration').value;
    const newEntry = {
        data: new Date().toLocaleDateString('pt-BR'),
        hora: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}),
        info: `Velocidade: ${durValue}s | Total: ${stimulusCount}`
    };
    history.unshift(newEntry);
    localStorage.setItem('reactionHistory', JSON.stringify(history.slice(0, 5)));
    displayHistory();
}

function displayHistory() {
    const history = JSON.parse(localStorage.getItem('reactionHistory') || '[]');
    const list = document.getElementById('history-list');
    list.innerHTML = history.length === 0 ? "<p style='color: #666; font-size: 0.8em;'>Grimório vazio.</p>" : 
        history.map(item => `<div class="history-item"><strong>${item.data} - ${item.hora}</strong><br>${item.info}</div>`).join('');
}

function clearHistory() {
    if(confirm("Deseja apagar os registros do Grimório?")) {
        localStorage.removeItem('reactionHistory');
        displayHistory();
    }
}
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://xml-a96l.onrender.com';

let reservasCache = [];
let hospedesCache = [];

document.addEventListener('DOMContentLoaded', () => {
    initMainNav();
    initTabs();
    verificarAPIStatus();
    carregarEstatisticas();
    carregarDadosSelects();
    setupUrlUpdaters();
    setupFormCriar();
});


const swalConfig = {
    background: '#1e1b2e',
    color: '#fff',
    confirmButtonColor: '#5d3e8f',
    cancelButtonColor: '#aaa',
    iconColor: '#5d3e8f'
};

const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: '#1e1b2e',
    color: '#e2e8f0',
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
});

function setupFormCriar() {
    const form = document.getElementById('form-criar-reserva');
    if (!form) return;


    const idReservaInput = document.getElementById('novo-id-reserva');
    if (idReservaInput) {
        let msgErro = idReservaInput.parentNode.querySelector('.hint');

        if (!msgErro) {
            msgErro = document.createElement('small');
            msgErro.className = 'hint';
            idReservaInput.parentNode.appendChild(msgErro);
        }

        idReservaInput.addEventListener('blur', async () => {
            const val = idReservaInput.value.trim();

            idReservaInput.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            msgErro.style.color = 'var(--text-secondary)';

            if (!val) {
                msgErro.innerHTML = 'Formato: RESxxx';
                return;
            }

            const regex = /^RES\d{3}$/;
            if (!regex.test(val)) {
                idReservaInput.style.borderColor = 'var(--accent-primary)';
                msgErro.style.color = 'var(--accent-primary)';
                msgErro.innerHTML = '<i class="fas fa-times-circle"></i> Formato inválido! Usa RESxxx (ex: RES001)';
                return;
            }

            try {
                const resp = await fetch(`${API_URL}/api/reservas/${val}`);
                if (resp.ok) {

                    idReservaInput.style.borderColor = 'var(--accent-primary)';
                    msgErro.style.color = 'var(--accent-primary)';
                    msgErro.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Esse ID já existe!';
                } else if (resp.status === 404) {
                    idReservaInput.style.borderColor = 'var(--accent-primary)';
                    msgErro.style.color = 'var(--accent-primary)';
                    msgErro.innerHTML = '<i class="fas fa-check-circle"></i> ID disponível';
                }
            } catch (e) {
                console.error("Erro validação:", e);
            }
        });


        idReservaInput.addEventListener('input', () => {
            idReservaInput.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            msgErro.style.color = 'var(--text-secondary)';


            if (!idReservaInput.value.trim()) {
                msgErro.innerHTML = 'Formato: RESxxx';
            } else {
                msgErro.innerHTML = '&nbsp;';
            }
        });
    }


    const serviceCards = document.querySelectorAll('.service-option-card');

    if (serviceCards.length > 0) {
        serviceCards.forEach(card => {
            const inputs = card.querySelectorAll('input');
            inputs.forEach(input => {
                input.addEventListener('click', (e) => e.stopPropagation());
            });

            card.addEventListener('click', () => {
                if (card.classList.contains('active')) {
                    card.classList.remove('active');
                    const qtdInput = card.querySelector('.svc-qtd');
                    const priceInput = card.querySelector('.svc-price');
                    if (qtdInput) qtdInput.value = "1";
                    if (priceInput) priceInput.value = "0.00";
                    return;
                }

                const ativos = document.querySelectorAll('.service-option-card.active').length;
                if (ativos >= 4) {
                    Swal.fire({
                        ...swalConfig,
                        icon: 'warning',
                        title: 'Limite Atingido',
                        text: 'Máximo de 4 serviços permitidos.',
                        toast: true,
                        position: 'center',
                        showConfirmButton: false,
                        timer: 2000
                    });
                    return;
                }

                card.classList.add('active');
            });
        });
    }


    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        Swal.fire({
            ...swalConfig,
            title: 'A criar reserva...',
            html: 'Por favor aguarde.',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        const servicos = [];
        const activeCards = document.querySelectorAll('.service-option-card.active');

        activeCards.forEach(card => {
            const tipo = card.getAttribute('data-type');
            const qtd = parseInt(card.querySelector('.svc-qtd').value || '1');
            const preco = parseFloat(card.querySelector('.svc-price').value || '0');

            if (tipo) {
                servicos.push({ tipo, quantidade: qtd, preco });
            }
        });

        const checkIn = document.getElementById('novo-checkin').value;
        const checkOut = document.getElementById('novo-checkout').value;

        if (new Date(checkIn) >= new Date(checkOut)) {
            Swal.fire({
                ...swalConfig,
                icon: 'error',
                title: 'Datas Inválidas',
                text: 'O check-in deve ser antes do check-out!'
            });
            return;
        }

        const data = {
            numeroReserva: document.getElementById('novo-id-reserva').value,
            unidade: document.getElementById('novo-unidade').value,
            hospede: {
                nome: document.getElementById('novo-nome').value,
                numeroCliente: document.getElementById('novo-id-cliente').value
            },
            quarto: document.getElementById('novo-quarto').value,
            checkIn: checkIn,
            checkOut: checkOut,
            valorTotal: parseFloat(document.getElementById('novo-valor').value),
            servicosAdicionais: servicos
        };

        try {
            const response = await fetch(`${API_URL}/api/reservas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const text = await response.text();
            let resData;
            try { resData = JSON.parse(text); } catch (e) { throw new Error(text); }

            if (response.ok) {
                Swal.fire({
                    ...swalConfig,
                    icon: 'success',
                    title: 'Reserva Criada!',
                    text: 'A reserva foi registada com sucesso.',
                    timer: 2000,
                    showConfirmButton: false
                });

                const resultDiv = document.getElementById('result-criar');
                if (resultDiv) {
                    const dados = resData.dados || data;
                    const servicosList = dados.servicosAdicionais && dados.servicosAdicionais.length > 0
                        ? dados.servicosAdicionais.map(s => `<span style="background:rgba(168,85,247,0.2); padding:2px 8px; border-radius:4px; font-size:0.8rem;">${s.quantidade}x ${s.tipo}</span>`).join(' ')
                        : '<span style="color:#666; font-style:italic;">Sem serviços</span>';

                    resultDiv.innerHTML = `
                        <div style="background: var(--bg-card); border: 1px solid var(--accent-primary); border-radius: 16px; padding: 20px; text-align: left; animation: fadeIn 0.5s;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid var(--border); padding-bottom:10px;">
                                <h3 style="margin:0; color:white; font-size:1.2rem;"><i class="fas fa-check-circle" style="color:var(--accent-primary);"></i> Reserva Confirmada</h3>
                                <span style="background:var(--gradient-primary); padding:4px 10px; border-radius:12px; font-size:0.8rem; font-weight:bold;">${dados.numeroReserva}</span>
                            </div>
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size:0.9rem; color:var(--text-secondary);">
                                <div><strong style="color:white;">Hóspede:</strong><br>${dados.hospede.nome}</div>
                                <div><strong style="color:white;">Unidade:</strong><br>${dados.unidade} - Quarto ${dados.quarto}</div>
                                <div><strong style="color:white;">Check-in:</strong><br>${dados.checkIn}</div>
                                <div><strong style="color:white;">Total:</strong><br><span style="var(--accent-primary); font-weight:bold; font-size:1.1rem;">€${dados.valorTotal}</span></div>
                            </div>
                            <div style="margin-top:15px; padding-top:10px; border-top:1px dashed var(--border);">
                                <strong style="color:white; font-size:0.85rem;">Serviços Extra:</strong>
                                <div style="margin-top:5px; display:flex; flex-wrap:wrap; gap:5px;">${servicosList}</div>
                            </div>
                        </div>
                    `;
                }

                form.reset();
                if (serviceCards.length > 0) {
                    serviceCards.forEach(c => {
                        c.classList.remove('active');
                        const pInput = c.querySelector('.svc-price');
                        if (pInput) pInput.value = "0.00";
                        const qInput = c.querySelector('.svc-qtd');
                        if (qInput) qInput.value = "1";
                    });
                }

                carregarDadosSelects();
                carregarEstatisticas();
            } else {
                throw new Error(resData.erro || 'Erro desconhecido');
            }
        } catch (error) {
            Swal.fire({
                ...swalConfig,
                icon: 'error',
                title: 'Erro',
                text: error.message
            });
        }
    });
}

function setupUrlUpdaters() {
    const selectHospede = document.getElementById('select-hospede');
    const urlHospede = document.querySelector('#panel-hospede .endpoint-url');

    if (selectHospede && urlHospede) {
        selectHospede.addEventListener('change', (e) => {
            const val = e.target.value;
            urlHospede.textContent = val ? `/api/reservas/hospede/${val}` : '/api/reservas/hospede/:numeroCliente';
        });
    }

    const selectReserva = document.getElementById('select-reserva');
    const urlReserva = document.querySelector('#panel-reserva .endpoint-url');

    if (selectReserva && urlReserva) {
        selectReserva.addEventListener('change', (e) => {
            const val = e.target.value;
            urlReserva.textContent = val ? `/api/reservas/${val}` : '/api/reservas/:numero';
        });
    }

    const selectServico = document.getElementById('select-servico');
    const urlServico = document.querySelector('#panel-servicos .endpoint-url');

    if (selectServico && urlServico) {
        selectServico.addEventListener('change', (e) => {
            const val = e.target.value;
            urlServico.textContent = val === 'todos'
                ? '/api/servicos/total'
                : `/api/servicos/total/${val}`;
        });
    }

    const selectPut = document.getElementById('select-reserva-put');
    const urlPut = document.querySelector('#panel-atualizar .endpoint-url');
    if (selectPut && urlPut) {
        selectPut.addEventListener('change', (e) => {
            urlPut.textContent = e.target.value ? `/api/reservas/${e.target.value}` : '/api/reservas/:numero';
        });
    }

    const selectDel = document.getElementById('select-reserva-del');
    const urlDel = document.querySelector('#panel-apagar .endpoint-url');
    if (selectDel && urlDel) {
        selectDel.addEventListener('change', (e) => {
            urlDel.textContent = e.target.value ? `/api/reservas/${e.target.value}` : '/api/reservas/:numero';
        });
    }
}

function initMainNav() {
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            document.querySelectorAll('.main-section').forEach(section => {
                section.classList.remove('active');
            });

            const targetSection = document.getElementById(`section-${btn.dataset.section}`);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });
}

function initTabs() {
    document.querySelectorAll('.query-tabs').forEach(container => {
        const tabs = container.querySelectorAll('.tab-btn');
        const section = container.closest('.queries-section');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                section.querySelectorAll('.tab-panel').forEach(panel => {
                    panel.classList.remove('active');
                });

                const targetPanel = section.querySelector(`#panel-${tab.dataset.tab}`);
                if (targetPanel) {
                    targetPanel.classList.add('active');
                }
            });
        });
    });
}

async function verificarAPIStatus() {
    const statusDot = document.getElementById('api-status-dot');
    const statusText = document.getElementById('api-status-text');

    try {
        const response = await fetch(`${API_URL}/api/reservas`);
        if (response.ok) {
            statusDot.classList.add('online');
            statusDot.classList.remove('offline');
            statusText.textContent = 'API Online';
        } else {
            throw new Error('API offline');
        }
    } catch (error) {
        statusDot.classList.add('offline');
        statusDot.classList.remove('online');
        statusText.textContent = 'API Offline';
    }
}

async function carregarEstatisticas() {
    try {
        const response = await fetch(`${API_URL}/api/estatisticas`);
        const data = await response.json();

        if (data.sucesso) {
            const stats = data.estatisticas;
            animateNumber('total-reservas', stats.totalReservas);
            animateNumber('valor-total', stats.valorTotal, '€', true);
            animateNumber('valor-medio', stats.valorMedio, '€', true);
            animateNumber('total-servicos', stats.totalServicos);
        }
    } catch (error) {
        animateNumber('total-reservas', 9);
        animateNumber('valor-total', 4250.00, '€', true);
        animateNumber('valor-medio', 472.22, '€', true);
        animateNumber('total-servicos', 18);
    }

    carregarGraficos();
    carregarStatsUnidades();
}

async function carregarGraficos() {
    const demoUnidades = [
        { unidade: 'LS', quantidadeReservas: 3 },
        { unidade: 'PO', quantidadeReservas: 2 },
        { unidade: 'CB', quantidadeReservas: 1 },
        { unidade: 'FR', quantidadeReservas: 2 },
        { unidade: 'BR', quantidadeReservas: 1 }
    ];

    const demoServicos = [
        { tipo: 'spa', quantidadeTotal: 5 },
        { tipo: 'restaurante', quantidadeTotal: 8 },
        { tipo: 'transporte', quantidadeTotal: 3 },
        { tipo: 'outros', quantidadeTotal: 2 }
    ];

    try {
        const resUnidades = await fetch(`${API_URL}/api/reservas/unidade`);
        const dataUnidades = await resUnidades.json();

        if (dataUnidades.sucesso && dataUnidades.reservasPorUnidade && dataUnidades.reservasPorUnidade.length > 0) {
            renderChartUnidades(dataUnidades.reservasPorUnidade);
        } else {
            renderChartUnidades(demoUnidades);
        }

        const resServicos = await fetch(`${API_URL}/api/servicos/total`);
        const dataServicos = await resServicos.json();

        if (dataServicos.sucesso && dataServicos.servicosPorTipo && dataServicos.servicosPorTipo.length > 0) {
            renderChartServicos(dataServicos.servicosPorTipo);
        } else {
            renderChartServicos(demoServicos);
        }
    } catch (error) {
        console.log('API offline - a mostrar dados demo');
        renderChartUnidades(demoUnidades);
        renderChartServicos(demoServicos);
    }
}

let chartInstances = {};

function renderChartUnidades(data, containerId = 'chart-unidades') {
    const ctx = document.getElementById(containerId);
    if (!ctx) return;

    // Garantir altura para o gráfico
    if (containerId !== 'chart-unidades') {
        ctx.style.height = '300px';
        ctx.style.position = 'relative';
    }

    ctx.innerHTML = '<canvas></canvas>';
    const canvas = ctx.querySelector('canvas');

    // Destruir instância anterior se existir para este container
    if (chartInstances[containerId]) {
        chartInstances[containerId].destroy();
        delete chartInstances[containerId];
    }

    chartInstances[containerId] = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: data.map(u => u.nomeUnidade || u.unidade),
            datasets: [{
                label: 'Reservas',
                data: data.map(u => u.quantidadeReservas),
                backgroundColor: [
                    'rgba(168, 85, 247, 0.7)',
                    'rgba(192, 132, 252, 0.7)',
                    'rgba(93, 62, 143, 0.7)',
                    'rgba(216, 180, 254, 0.7)',
                    'rgba(255, 255, 255, 0.7)'
                ],
                borderColor: [
                    '#a855f7',
                    '#c084fc',
                    '#5d3e8f',
                    '#d8b4fe',
                    '#ffffff'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: 'Volume de Reservas por Unidade',
                    color: '#e0d0f0',
                    font: { family: 'Inter', size: 14 }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#a090b0' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#a090b0' }
                }
            }
        }
    });
}

function renderChartServicos(data, containerId = 'chart-servicos') {
    const ctx = document.getElementById(containerId);
    if (!ctx) return;

    if (containerId !== 'chart-servicos') {
        ctx.style.height = '300px';
        ctx.style.position = 'relative';
    }

    ctx.innerHTML = '<canvas></canvas>';
    const canvas = ctx.querySelector('canvas');

    if (chartInstances[containerId]) {
        chartInstances[containerId].destroy();
        delete chartInstances[containerId];
    }

    chartInstances[containerId] = new Chart(canvas, {
        type: 'bar', // Alterado de doughnut para bar
        data: {
            labels: data.map(s => s.tipo ? s.tipo.charAt(0).toUpperCase() + s.tipo.slice(1) : 'Outros'),
            datasets: [{
                label: 'Quantidade Vendida',
                data: data.map(s => s.quantidadeTotal),
                backgroundColor: [
                    'rgba(168, 85, 247, 0.8)',
                    'rgba(240, 171, 252, 0.8)',
                    'rgba(140, 118, 168, 0.8)',
                    'rgba(255, 255, 255, 0.8)'
                ],
                borderColor: '#1e1b2e',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y', // Gráfico horizontal para ser "diferente" e "fixe"
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    right: 20 // Espaço extra para tooltips não cortarem
                }
            },
            plugins: {
                legend: {
                    display: false // Esconder legenda redundante em barras
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 27, 46, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#e0d0f0',
                    borderColor: 'rgba(168, 85, 247, 0.3)',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#a090b0', precision: 0 },
                    beginAtZero: true
                },
                y: {
                    grid: { display: false },
                    ticks: { color: '#e0d0f0', font: { family: 'Inter', weight: '500' } }
                }
            }
        }
    });
}

async function carregarStatsUnidades() {
    try {
        const response = await fetch(`${API_URL}/api/reservas/unidade`);
        const data = await response.json();

        if (data.sucesso && data.reservasPorUnidade) {
            const unidades = ['LS', 'PO', 'CB', 'FR', 'BR'];
            unidades.forEach(u => {
                const elem = document.getElementById(`stats-${u}`);
                if (elem) {
                    const found = data.reservasPorUnidade.find(r => r.unidade === u);
                    elem.textContent = found ? found.quantidadeReservas : 0;
                }
            });
        }
    } catch (error) {
        console.error('Erro ao carregar stats unidades:', error);
    }
}

function animateNumber(elementId, targetValue, prefix = '', isDecimal = false) {
    const element = document.getElementById(elementId);
    const duration = 1000;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = targetValue * easeProgress;

        if (isDecimal) {
            element.textContent = prefix + currentValue.toFixed(2);
        } else {
            element.textContent = prefix + Math.round(currentValue);
        }

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

async function carregarDadosSelects() {
    try {
        const response = await fetch(`${API_URL}/api/reservas`);
        const data = await response.json();

        if (data.sucesso && data.dados) {
            reservasCache = data.dados;

            const hospedesMap = new Map();
            data.dados.forEach(r => {
                if (!hospedesMap.has(r.hospede.numeroCliente)) {
                    hospedesMap.set(r.hospede.numeroCliente, r.hospede.nome);
                }
            });
            hospedesCache = Array.from(hospedesMap, ([id, nome]) => ({ id, nome }));

            const selectHospede = document.getElementById('select-hospede');
            selectHospede.innerHTML = '<option value="">Seleccionar...</option>';
            hospedesCache.forEach(h => {
                const option = document.createElement('option');
                option.value = h.id;
                option.textContent = `${h.nome} (${h.id})`;
                selectHospede.appendChild(option);
            });

            // Popular também o dropdown XQuery (XQ1)
            const selectXqHospede = document.getElementById('select-xq-hospede');
            if (selectXqHospede) {
                selectXqHospede.innerHTML = '<option value="">Seleccionar...</option>';
                hospedesCache.forEach(h => {
                    const option = document.createElement('option');
                    option.value = h.id;
                    option.textContent = `${h.nome} (${h.id})`;
                    selectXqHospede.appendChild(option);
                });
            }

            const populateSelect = (selectId) => {
                const select = document.getElementById(selectId);
                if (!select) return;
                select.innerHTML = '<option value="">Seleccionar...</option>';
                data.dados.forEach(r => {
                    const option = document.createElement('option');
                    option.value = r.numeroReserva;
                    option.textContent = `${r.numeroReserva} - ${r.hospede.nome}`;
                    select.appendChild(option);
                });
            };

            populateSelect('select-reserva');
            populateSelect('select-reserva-put');
            populateSelect('select-reserva-del');
            populateSelect('select-mongo-reserva'); // Adicionado para Mongo Query 5
        }
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

function toggleCode(id) {
    const container = document.getElementById(`code-${id}`);
    container.classList.toggle('hidden');
}

async function executarQuery(tipo) {
    const resultDiv = document.getElementById(`result-${tipo}`);
    resultDiv.innerHTML = '<div class="loading"><div class="loading-spinner"></div><span>A executar...</span></div>';

    let url = '';

    switch (tipo) {
        case 'todas':
            url = `${API_URL}/api/reservas`;
            break;
        case 'hospede':
            const numeroCliente = document.getElementById('select-hospede').value;
            if (!numeroCliente) {
                resultDiv.innerHTML = '<div class="placeholder"><i class="fas fa-exclamation-triangle placeholder-icon"></i><p>Selecciona um hóspede</p></div>';
                return;
            }
            url = `${API_URL}/api/reservas/hospede/${numeroCliente}`;
            break;
        case 'unidade':
            url = `${API_URL}/api/reservas/unidade`;
            break;
        case 'servicos':
            url = `${API_URL}/api/servicos/total`;
            break;
        case 'reserva':
            const numeroReserva = document.getElementById('select-reserva').value;
            if (!numeroReserva) {
                resultDiv.innerHTML = '<div class="placeholder"><i class="fas fa-exclamation-triangle placeholder-icon"></i><p>Selecciona uma reserva</p></div>';
                return;
            }
            url = `${API_URL}/api/reservas/${numeroReserva}`;
            break;
        case 'maior':
            url = `${API_URL}/api/reservas/maior`;
            break;
        case 'criar':
            // Gerido pelo form submit event, mas se o botão executar for clicado fora do form (não existe botão executar solto agora)
            return;

        case 'atualizar':
            const numPut = document.getElementById('select-reserva-put').value;
            if (!numPut) {
                Swal.fire({
                    ...swalConfig,
                    icon: 'warning',
                    title: 'Atenção',
                    text: 'Selecciona uma reserva para atualizar!'
                });
                return;
            }

            Swal.fire({
                ...swalConfig,
                title: 'Novo valor total',
                input: 'text',
                inputLabel: `Insere o novo valor total para a reserva ${numPut}:`,
                inputPlaceholder: 'Ex: 500.00',
                showCancelButton: true,
                confirmButtonText: 'Atualizar',
                cancelButtonText: 'Cancelar',
                inputValidator: (value) => {
                    if (!value || isNaN(parseFloat(value))) {
                        return 'Por favor, insere um valor numérico válido!';
                    }
                }
            }).then(async (result) => {
                if (result.isConfirmed) {
                    const novoValor = parseFloat(result.value);
                    try {
                        const response = await fetch(`${API_URL}/api/reservas/${numPut}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ valorTotal: novoValor })
                        });
                        const data = await response.json();

                        if (response.ok) {
                            Swal.fire({
                                ...swalConfig,
                                title: 'Atualizado!',
                                text: 'A reserva foi atualizada com sucesso.',
                                icon: 'success'
                            });
                            carregarEstatisticas();
                            resultDiv.innerHTML = `<div class="success-msg"><i class="fas fa-check-circle"></i> Reserva atualizada</div>`;
                        } else {
                            Swal.fire({
                                ...swalConfig,
                                title: 'Erro!',
                                text: data.erro || 'Erro desconhecido ao atualizar.',
                                icon: 'error'
                            });
                        }
                    } catch (error) {
                        Swal.fire({
                            ...swalConfig,
                            title: 'Erro!',
                            text: 'Falha na comunicação com o servidor.',
                            icon: 'error'
                        });
                    }
                }
            });
            return;

        case 'apagar':
            const numDel = document.getElementById('select-reserva-del').value;
            if (!numDel) {
                Swal.fire({
                    ...swalConfig,
                    icon: 'warning',
                    title: 'Atenção',
                    text: 'Selecciona uma reserva para eliminar!'
                });
                return;
            }

            Swal.fire({
                ...swalConfig, // Thema
                title: 'Tem a certeza?',
                text: `Deseja eliminar a reserva ${numDel}? Esta ação é irreversível!`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sim, eliminar',
                cancelButtonText: 'Cancelar'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const response = await fetch(`${API_URL}/api/reservas/${numDel}`, {
                            method: 'DELETE'
                        });
                        const data = await response.json();

                        if (response.ok) {
                            Swal.fire({
                                ...swalConfig,
                                title: 'Apagado!',
                                text: 'A reserva foi eliminada.',
                                icon: 'success'
                            });
                            carregarDadosSelects();
                            carregarEstatisticas();
                            resultDiv.innerHTML = `<div class="success-msg"><i class="fas fa-trash"></i> Reserva apagada</div>`;
                        } else {
                            Swal.fire({
                                ...swalConfig,
                                title: 'Erro!',
                                text: data.erro,
                                icon: 'error'
                            });
                        }
                    } catch (error) {
                        Swal.fire({
                            ...swalConfig,
                            title: 'Erro!',
                            text: 'Falha na comunicação com o servidor',
                            icon: 'error'
                        });
                    }
                }
            });
            return;
    }

    try {
        const response = await fetch(url);
        const data = await response.json();

        const filtro = document.getElementById('select-servico')?.value;
        if (tipo === 'servicos' && filtro && filtro !== 'todos' && data.servicosPorTipo) {
            data.servicosPorTipo = data.servicosPorTipo.filter(s => s.tipo === filtro);
        }

        resultDiv.innerHTML = `<pre>${formatJSON(data)}</pre>`;
    } catch (error) {
        resultDiv.innerHTML = `<div class="placeholder error"><i class="fas fa-times-circle placeholder-icon"></i><p>Erro: ${error.message}</p><p class="hint">Verifica se o servidor está a correr</p></div>`;
    }
}

// Helper para alternar entre Gráfico e JSON
window.toggleResultView = function (tipo) {
    const vis = document.getElementById(`vis-container-${tipo}`);
    const json = document.getElementById(`json-container-${tipo}`);
    const btn = document.getElementById(`btn-toggle-${tipo}`);

    if (!vis || !json || !btn) return;

    if (vis.style.display === 'none') {
        // Mostrar Gráfico
        vis.style.display = 'block';
        json.style.display = 'none';
        btn.innerHTML = '<i class="fas fa-code"></i> Ver JSON';
        // Forçar resize se necessário para Chart.js
        const chartId = `chart-container-${tipo}`;
        if (typeof chartInstances !== 'undefined' && chartInstances[chartId]) {
            chartInstances[chartId].resize();
        }
    } else {
        // Mostrar JSON
        vis.style.display = 'none';
        json.style.display = 'block';
        btn.innerHTML = '<i class="fas fa-chart-bar"></i> Ver Gráfico';
    }
};

async function executarQueryMongo(tipo) {
    const resultDiv = document.getElementById(`result-${tipo}`);
    resultDiv.innerHTML = '<div class="loading"><div class="loading-spinner"></div><span>A executar...</span></div>';

    const endpoints = {
        'mongo1': '/api/servicos/total',
        'mongo2': '/api/reservas/unidade',
        'mongo3': '/api/reservas/media',
        'mongo4': '/api/reservas/maior',
        'mongo5': '/api/reservas/'
    };

    let url = API_URL + endpoints[tipo];

    if (tipo === 'mongo5') {
        const reserva = document.getElementById('select-mongo-reserva').value;
        url += reserva;
    }

    try {
        const response = await fetch(url);
        const data = await response.json();

        // Limpar resultado anterior e preparar layout
        resultDiv.innerHTML = '';
        resultDiv.style.height = 'auto';

        // Helper para criar estrutura de Toggle (Default: JSON)
        const createToggleStructure = (tipo) => {
            // Header com Botão
            const controls = document.createElement('div');
            controls.style.display = 'flex';
            controls.style.justifyContent = 'flex-end';
            controls.style.marginBottom = '1rem';

            const btn = document.createElement('button');
            btn.id = `btn-toggle-${tipo}`;
            btn.className = 'btn-secondary';
            btn.innerHTML = '<i class="fas fa-chart-bar"></i> Ver Gráfico'; // Botão sugere ver o gráfico (que está escondido)
            btn.style.fontSize = '0.8rem';
            btn.style.padding = '0.4rem 0.8rem';
            btn.onclick = () => window.toggleResultView(tipo);

            controls.appendChild(btn);
            resultDiv.appendChild(controls);

            // Container Visual (Gráfico/Cards) - INICIALMENTE ESCONDIDO (display: none) "tira o gráfico"
            const visContainer = document.createElement('div');
            visContainer.id = `vis-container-${tipo}`;
            visContainer.style.display = 'none';
            visContainer.style.width = '100%';
            visContainer.style.minHeight = '350px';
            visContainer.style.position = 'relative';
            resultDiv.appendChild(visContainer);

            // Container JSON - INICIALMENTE VISÍVEL
            const jsonContainer = document.createElement('div');
            jsonContainer.id = `json-container-${tipo}`;
            jsonContainer.className = 'json-output-container';
            jsonContainer.style.padding = '1rem';
            jsonContainer.style.marginTop = '0';
            jsonContainer.style.maxHeight = '400px';
            jsonContainer.style.overflowY = 'auto';
            jsonContainer.innerHTML = `<pre>${formatJSON(data)}</pre>`;
            resultDiv.appendChild(jsonContainer);

            return visContainer;
        };

        if (tipo === 'mongo1') { // Serviços
            const visContainer = createToggleStructure(tipo);
            if (data.sucesso && Array.isArray(data.servicosPorTipo)) {
                renderChartServicos(data.servicosPorTipo, visContainer.id);
            } else {
                visContainer.innerHTML = `<div class="placeholder error"><p>Dados insuficientes para gráfico.</p></div>`;
            }
        }
        else if (tipo === 'mongo2') { // Unidades
            const visContainer = createToggleStructure(tipo);
            if (data.sucesso && Array.isArray(data.unidades)) {
                renderChartUnidades(data.unidades, visContainer.id);
            } else {
                visContainer.innerHTML = `<div class="placeholder error"><p>Dados insuficientes para gráfico.</p></div>`;
            }
        }
        else if (tipo === 'mongo3') { // Média
            const visContainer = createToggleStructure(tipo);
            visContainer.style.minHeight = 'auto';

            if (data.sucesso && data.dados) {
                const stats = data.dados;
                visContainer.innerHTML = `
                <div class="mongo-visual-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
                    <div class="stats-card glass-card" style="padding: 1.5rem; text-align: center; display: flex; flex-direction: column; align-items: center;">
                        <div style="font-size: 2rem; color: #a855f7; margin-bottom: 0.5rem;"><i class="fas fa-coins"></i></div>
                        <div style="font-size: 0.9rem; color: #a090b0; text-transform: uppercase;">Valor Médio</div>
                        <div style="font-size: 1.8rem; font-weight: 700; color: #fff;">${stats.valorMedio}€</div>
                    </div>
                    <div class="stats-card glass-card" style="padding: 1.5rem; text-align: center; display: flex; flex-direction: column; align-items: center;">
                        <div style="font-size: 2rem; color: #f0abfc; margin-bottom: 0.5rem;"><i class="fas fa-receipt"></i></div>
                        <div style="font-size: 0.9rem; color: #a090b0; text-transform: uppercase;">Total Reservas</div>
                        <div style="font-size: 1.8rem; font-weight: 700; color: #fff;">${stats.totalReservas}</div>
                    </div>
                    <div class="stats-card glass-card" style="padding: 1.5rem; text-align: center; display: flex; flex-direction: column; align-items: center;">
                        <div style="font-size: 2rem; color: #8c76a8; margin-bottom: 0.5rem;"><i class="fas fa-wallet"></i></div>
                        <div style="font-size: 0.9rem; color: #a090b0; text-transform: uppercase;">Receita Total</div>
                        <div style="font-size: 1.8rem; font-weight: 700; color: #fff;">${stats.valorTotalGeral}€</div>
                    </div>
                </div>`;
            } else {
                visContainer.innerHTML = `<div class="placeholder error"><p>Sem dados estatísticos.</p></div>`;
            }
        }
        else if (tipo === 'mongo4' || tipo === 'mongo5') { // Maior Reserva ou Reserva Específica
            const toggleContainer = createToggleStructure(tipo);
            toggleContainer.style.minHeight = 'auto';

            // Dados podem vir de 'maiorReserva' (mongo4) ou 'dados' (mongo5 - endpoint /:id) ou 'reserva' (backend generic)
            const reserva = data.maiorReserva || data.dados || data.reserva;

            if (data.sucesso && reserva) {
                // Estrutura Visual: Detalhes + Donut Chart de Custos
                toggleContainer.innerHTML = `
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; align-items: start;">
                        <div class="glass-card" style="padding: 1.5rem;">
                            <h4 style="color: var(--accent-primary); margin-bottom: 1rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">
                                <i class="fas fa-info-circle"></i> Detalhes da Reserva
                            </h4>
                            <div style="display: flex; flex-direction: column; gap: 0.8rem; font-size: 0.9rem; color: var(--text-secondary);">
                                <div><strong style="color: #fff;">Reserva:</strong> ${reserva.numeroReserva}</div>
                                <div><strong style="color: #fff;">Hóspede:</strong> ${reserva.hospede ? reserva.hospede.nome : 'N/A'}</div>
                                <div><strong style="color: #fff;">Unidade:</strong> ${reserva.unidade}</div>
                                <div><strong style="color: #fff;">Check-in:</strong> ${reserva.checkIn}</div>
                                <div><strong style="color: #fff;">Total:</strong> <span style="color: var(--accent-primary); font-weight: bold; font-size: 1.1rem;">${reserva.valorTotal}€</span></div>
                            </div>
                        </div>
                        <div class="glass-card" style="padding: 1.5rem; height: 320px; position: relative;">
                             <h4 style="color: var(--accent-primary); margin-bottom: 1rem; text-align: center;">
                                <i class="fas fa-chart-pie"></i> Composição de Custos
                            </h4>
                            <div class="chart-wrapper" style="height: 250px; position: relative;">
                                <canvas id="chart-reserva-${tipo}"></canvas>
                            </div>
                        </div>
                    </div>
                `;

                // Gerar Gráfico no canvas criado acima
                renderChartReservaDetalhe(reserva, `chart-reserva-${tipo}`);
            } else {
                toggleContainer.innerHTML = `<div class="placeholder error"><p>Reserva não encontrada.</p></div>`;
            }
        }
        else {
            // Default: Apenas JSON
            resultDiv.style.height = 'auto';
            resultDiv.innerHTML = `<pre>${formatJSON(data)}</pre>`;
        }

    } catch (error) {
        resultDiv.innerHTML = `<div class="placeholder error"><i class="fas fa-times-circle placeholder-icon"></i><p>Erro: ${error.message}</p></div>`;
    }
}

function renderChartReservaDetalhe(reserva, containerId) {
    const ctx = document.getElementById(containerId);
    if (!ctx) return;

    if (chartInstances[containerId]) {
        chartInstances[containerId].destroy();
        delete chartInstances[containerId];
    }

    // Calcular custos
    let custoServicos = 0;
    const servicosLabels = [];
    const servicosValores = [];
    const servicosCores = ['#f0abfc', '#c084fc', '#a855f7', '#7e22ce']; // Tons roxos

    if (reserva.servicosAdicionais && Array.isArray(reserva.servicosAdicionais)) {
        reserva.servicosAdicionais.forEach(s => {
            const custo = s.quantidade * s.preco;
            custoServicos += custo;
            servicosLabels.push(s.tipo);
            servicosValores.push(custo);
        });
    }

    const custoQuarto = reserva.valorTotal - custoServicos;

    // Dados para o gráfico
    const labels = ['Alojamento', ...servicosLabels];
    const dataValues = [custoQuarto, ...servicosValores];
    const bgColors = ['#5d3e8f', ...servicosCores.slice(0, servicosLabels.length)]; // Roxo escuro para quarto

    chartInstances[containerId] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: bgColors,
                borderColor: '#1e1b2e',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: '#e0d0f0', font: { size: 11 } }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.label || '';
                            if (label) { label += ': '; }
                            if (context.parsed !== null) {
                                label += new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(context.parsed);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

async function executarQueryXQ(tipo) {
    const resultDiv = document.getElementById(`result-${tipo}`);
    resultDiv.innerHTML = '<div class="loading"><div class="loading-spinner"></div><span>A executar...</span></div>';

    const endpoints = {
        'xq1': '/api/reservas/hospede/',
        'xq2': '/api/reservas/unidade',
        'xq3': '/api/servicos/total'
    };

    let url = API_URL + endpoints[tipo];

    if (tipo === 'xq1') {
        const hospede = document.getElementById('select-xq-hospede').value;
        if (!hospede) {
            resultDiv.innerHTML = '<div class="placeholder"><i class="fas fa-exclamation-triangle placeholder-icon"></i><p>Selecciona um hóspede</p></div>';
            return;
        }
        url += hospede;
    }

    try {
        const response = await fetch(url);
        const data = await response.json();

        resultDiv.innerHTML = '';

        // Helper para criar estrutura de Toggle (igual ao Mongo)
        const createToggleStructure = (tipo) => {
            const controls = document.createElement('div');
            controls.style.display = 'flex';
            controls.style.justifyContent = 'flex-end';
            controls.style.marginBottom = '1rem';

            const btn = document.createElement('button');
            btn.id = `btn-toggle-${tipo}`;
            btn.className = 'btn-secondary';
            btn.innerHTML = '<i class="fas fa-eye"></i> Ver Visualização';
            btn.style.fontSize = '0.8rem';
            btn.style.padding = '0.4rem 0.8rem';
            btn.onclick = () => window.toggleResultView(tipo);

            controls.appendChild(btn);
            resultDiv.appendChild(controls);

            // Container Visual (Timeline/Cards/Recibo) - INICIALMENTE ESCONDIDO
            const visContainer = document.createElement('div');
            visContainer.id = `vis-container-${tipo}`;
            visContainer.style.display = 'none';
            visContainer.style.width = '100%';
            visContainer.style.minHeight = '300px';
            visContainer.style.position = 'relative';
            resultDiv.appendChild(visContainer);

            // Container JSON - INICIALMENTE VISÍVEL
            const jsonContainer = document.createElement('div');
            jsonContainer.id = `json-container-${tipo}`;
            jsonContainer.className = 'json-output-container';
            jsonContainer.style.padding = '1rem';
            jsonContainer.style.marginTop = '0';
            jsonContainer.style.maxHeight = '400px';
            jsonContainer.style.overflowY = 'auto';
            jsonContainer.innerHTML = `<pre>${formatJSON(data)}</pre>`;
            resultDiv.appendChild(jsonContainer);

            return visContainer;
        };

        if (tipo === 'xq1') {
            // Timeline de Viagens (Histórico do Hóspede)
            const visContainer = createToggleStructure(tipo);

            if (data.sucesso && data.reservas && data.reservas.length > 0) {
                let timelineHTML = '<div class="timeline-container">';

                data.reservas.forEach(reserva => {
                    const unidadeNomes = {
                        'LS': 'Lisboa',
                        'PO': 'Porto',
                        'CB': 'Coimbra',
                        'FR': 'Faro',
                        'BR': 'Braga'
                    };

                    timelineHTML += `
                        <div class="timeline-item">
                            <div class="timeline-dot"></div>
                            <div class="timeline-content">
                                <span class="timeline-date">${reserva.checkIn}</span>
                                <div class="timeline-title">
                                    <span><i class="fas fa-hotel"></i> ${unidadeNomes[reserva.unidade] || reserva.unidade}</span>
                                    <span class="timeline-value">${reserva.valorTotal}€</span>
                                </div>
                                <div class="timeline-details">
                                    <span><i class="fas fa-calendar-check"></i> Check-out: ${reserva.checkOut}</span>
                                    <span><i class="fas fa-hashtag"></i> ${reserva.numeroReserva}</span>
                                </div>
                            </div>
                        </div>
                    `;
                });

                timelineHTML += '</div>';
                visContainer.innerHTML = timelineHTML;
            } else {
                visContainer.innerHTML = '<div class="placeholder"><i class="fas fa-calendar-times placeholder-icon"></i><p>Sem reservas para este hóspede</p></div>';
            }
        }
        else if (tipo === 'xq2') {
            // Cards Estilo Postal (Unidades)
            const visContainer = createToggleStructure(tipo);

            if (data.sucesso && data.unidades && data.unidades.length > 0) {
                const unidadeIcons = {
                    'LS': '<i class="fas fa-landmark"></i>',
                    'PO': '<i class="fas fa-anchor"></i>',
                    'CB': '<i class="fas fa-book"></i>',
                    'FR': '<i class="fas fa-umbrella-beach"></i>',
                    'BR': '<i class="fas fa-church"></i>'
                };

                let cardsHTML = '<div class="postal-cards-grid">';

                data.unidades.forEach(unidade => {
                    const icon = unidadeIcons[unidade.unidade] || '<i class="fas fa-hotel"></i>';
                    cardsHTML += `
                        <div class="postal-card">
                            <div class="postal-icon">${icon}</div>
                            <div class="postal-city">${unidade.nomeUnidade || unidade.unidade}</div>
                            <div class="postal-count">${unidade.quantidadeReservas}</div>
                            <div class="postal-label">Reservas</div>
                        </div>
                    `;
                });

                cardsHTML += '</div>';
                visContainer.innerHTML = cardsHTML;
            } else {
                visContainer.innerHTML = '<div class="placeholder"><i class="fas fa-map-marked-alt placeholder-icon"></i><p>Sem dados de unidades</p></div>';
            }
        }
        else if (tipo === 'xq3') {
            // Recibo/Fatura Digital (Serviços)
            const visContainer = createToggleStructure(tipo);

            if (data.sucesso && data.servicosPorTipo && data.servicosPorTipo.length > 0) {
                let receiptHTML = `
                    <div class="receipt-wrapper">
                        <div class="receipt-container">
                            <div class="receipt-header">
                                <div class="receipt-logo">HOTEL NETWORK</div>
                                <div class="receipt-subtitle">Resumo de Serviços</div>
                            </div>
                            
                            <div class="receipt-items">
                `;

                let subtotal = 0;
                data.servicosPorTipo.forEach(servico => {
                    const valor = servico.valorTotal || 0;
                    subtotal += valor;
                    receiptHTML += `
                        <div class="receipt-item">
                            <span class="receipt-item-name">
                                ${servico.tipo}
                                <span class="receipt-item-qty">(x${servico.quantidadeTotal})</span>
                            </span>
                            <span>${valor.toFixed(2)}€</span>
                        </div>
                    `;
                });

                receiptHTML += `
                            </div>
                            
                            <div class="receipt-divider"></div>
                            
                            <div class="receipt-subtotal">
                                <span>Subtotal</span>
                                <span>${subtotal.toFixed(2)}€</span>
                            </div>
                            
                            <div class="receipt-total">
                                <span>TOTAL</span>
                                <span>${subtotal.toFixed(2)}€</span>
                            </div>
                            
                            <div class="receipt-footer">
                                <div class="receipt-thank-you">Obrigado pela sua preferência!</div>
                                <div>Total de Serviços: ${data.totalServicos || data.servicosPorTipo.length}</div>
                            </div>
                        </div>
                    </div>
                `;

                visContainer.innerHTML = receiptHTML;
            } else {
                visContainer.innerHTML = '<div class="placeholder"><i class="fas fa-receipt placeholder-icon"></i><p>Sem serviços registados</p></div>';
            }
        }
        else {
            // Fallback: JSON padrão (createToggleStructure já cria o JSON container)
            createToggleStructure(tipo);
        }

    } catch (error) {
        resultDiv.innerHTML = `<div class="placeholder error"><i class="fas fa-times-circle placeholder-icon"></i><p>Erro: ${error.message}</p></div>`;
    }
}

function formatJSON(obj) {
    const json = JSON.stringify(obj, null, 2);
    return json
        .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
        .replace(/: "([^"]*?)"/g, ': <span class="json-string">"$1"</span>')
        .replace(/: (-?\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
        .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
        .replace(/: null/g, ': <span class="json-null">null</span>');
}

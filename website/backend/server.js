require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.path}`);
    next();
});

let db;

async function connectDB() {
    try {
        const client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        db = client.db('hotel');
        console.log('Conectado ao MongoDB Atlas!');
    } catch (error) {
        console.error('Erro ao conectar ao MongoDB:', error);
        process.exit(1);
    }
}


app.get('/api/reservas', async (req, res) => {
    try {
        const reservas = await db.collection('reservas').find({}).toArray();
        res.json({
            sucesso: true,
            total: reservas.length,
            dados: reservas
        });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});


app.get('/api/reservas/hospede/:numeroCliente', async (req, res) => {
    try {
        const { numeroCliente } = req.params;
        const reservas = await db.collection('reservas')
            .find({ 'hospede.numeroCliente': numeroCliente })
            .toArray();

        res.json({
            sucesso: true,
            hospede: numeroCliente,
            totalReservas: reservas.length,
            reservas: reservas.map(r => ({
                numeroReserva: r.numeroReserva,
                nome: r.hospede.nome,
                unidade: r.unidade,
                checkIn: r.checkIn,
                checkOut: r.checkOut,
                valorTotal: r.valorTotal,
                servicosAdicionais: r.servicosAdicionais
            }))
        });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});


app.get('/api/reservas/unidade', async (req, res) => {
    console.log('Processing /api/reservas/unidade request...');
    try {
        const resultado = await db.collection('reservas').aggregate([
            {
                $group: {
                    _id: '$unidade',
                    quantidadeReservas: { $count: {} },
                    valorTotalReservas: { $sum: '$valorTotal' }
                }
            },
            { $sort: { quantidadeReservas: -1 } },
            {
                $project: {
                    _id: 0,
                    unidade: '$_id',
                    nomeUnidade: {
                        $switch: {
                            branches: [
                                { case: { $eq: ['$_id', 'LS'] }, then: 'Lisboa' },
                                { case: { $eq: ['$_id', 'PO'] }, then: 'Porto' },
                                { case: { $eq: ['$_id', 'CB'] }, then: 'Coimbra' },
                                { case: { $eq: ['$_id', 'FR'] }, then: 'Faro' },
                                { case: { $eq: ['$_id', 'BR'] }, then: 'Braga' }
                            ],
                            default: 'Desconhecida'
                        }
                    },
                    quantidadeReservas: 1,
                    valorTotalReservas: { $round: ['$valorTotalReservas', 2] }
                }
            }
        ]).toArray();



        const totalGeral = resultado.reduce((acc, u) => acc + u.quantidadeReservas, 0);

        res.json({
            sucesso: true,
            totalGeral: totalGeral,
            reservasPorUnidade: resultado,
            unidades: resultado
        });
    } catch (error) {
        console.error('Erro em /api/reservas/unidade:', error);
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});


app.get('/api/reservas/media', async (req, res) => {
    try {
        const resultado = await db.collection('reservas').aggregate([
            {
                $group: {
                    _id: null,
                    valorMedio: { $avg: '$valorTotal' },
                    totalReservas: { $sum: 1 },
                    valorTotalGeral: { $sum: '$valorTotal' }
                }
            },
            {
                $project: {
                    _id: 0,
                    valorMedio: { $round: ['$valorMedio', 2] },
                    totalReservas: 1,
                    valorTotalGeral: { $round: ['$valorTotalGeral', 2] }
                }
            }
        ]).toArray();

        res.json({
            sucesso: true,
            dados: resultado[0] || { valorMedio: 0, totalReservas: 0, valorTotalGeral: 0 }
        });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});


app.get('/api/reservas/maior', async (req, res) => {
    try {
        const resultado = await db.collection('reservas').aggregate([
            { $sort: { valorTotal: -1 } },
            { $limit: 1 },
            {
                $project: {
                    _id: 0,
                    numeroReserva: 1,
                    'hospede.nome': 1,
                    'hospede.numeroCliente': 1,
                    unidade: 1,
                    checkIn: 1,
                    checkOut: 1,
                    valorTotal: 1,
                    totalServicos: { $size: '$servicosAdicionais' }
                }
            }
        ]).toArray();

        res.json({
            sucesso: true,
            maiorReserva: resultado[0] || null
        });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});


app.get('/api/servicos/total', async (req, res) => {
    try {
        const resultado = await db.collection('reservas').aggregate([
            { $unwind: '$servicosAdicionais' },
            {
                $group: {
                    _id: '$servicosAdicionais.tipo',
                    totalServicos: { $sum: 1 },
                    quantidadeTotal: { $sum: '$servicosAdicionais.quantidade' },
                    valorTotal: {
                        $sum: {
                            $multiply: ['$servicosAdicionais.preco', '$servicosAdicionais.quantidade']
                        }
                    }
                }
            },
            { $sort: { quantidadeTotal: -1 } },
            {
                $project: {
                    _id: 0,
                    tipo: '$_id',
                    totalServicos: 1,
                    quantidadeTotal: 1,
                    valorTotal: { $round: ['$valorTotal', 2] }
                }
            }
        ]).toArray();

        const totais = resultado.reduce((acc, s) => ({
            totalServicos: acc.totalServicos + s.totalServicos,
            quantidadeTotal: acc.quantidadeTotal + s.quantidadeTotal,
            valorTotal: acc.valorTotal + s.valorTotal
        }), { totalServicos: 0, quantidadeTotal: 0, valorTotal: 0 });

        res.json({
            sucesso: true,
            totalServicos: totais.totalServicos,
            totalQuantidade: totais.quantidadeTotal,
            valorTotal: Math.round(totais.valorTotal * 100) / 100,
            servicosPorTipo: resultado
        });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});


app.get('/api/reservas/:numeroReserva', async (req, res) => {
    try {
        const { numeroReserva } = req.params;
        console.log(`Buscando reserva específica: ${numeroReserva}`);

        const reserva = await db.collection('reservas').findOne({ numeroReserva });

        if (!reserva) {
            return res.status(404).json({
                sucesso: false,
                erro: 'Reserva não encontrada'
            });
        }

        res.json({
            sucesso: true,
            dados: reserva
        });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});


app.get('/api/estatisticas', async (req, res) => {
    try {
        const reservas = await db.collection('reservas').find({}).toArray();

        const totalReservas = reservas.length;
        const valorTotal = reservas.reduce((acc, r) => acc + r.valorTotal, 0);
        const valorMedio = totalReservas > 0 ? valorTotal / totalReservas : 0;

        const unidades = {};
        reservas.forEach(r => {
            unidades[r.unidade] = (unidades[r.unidade] || 0) + 1;
        });

        const servicos = {};
        let totalServicos = 0;
        reservas.forEach(r => {
            r.servicosAdicionais?.forEach(s => {
                servicos[s.tipo] = (servicos[s.tipo] || 0) + s.quantidade;
                totalServicos += s.quantidade;
            });
        });

        res.json({
            sucesso: true,
            estatisticas: {
                totalReservas,
                valorTotal: Math.round(valorTotal * 100) / 100,
                valorMedio: Math.round(valorMedio * 100) / 100,
                reservasPorUnidade: unidades,
                servicosPorTipo: servicos,
                totalServicos
            }
        });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});


const XSD_RULES = {
    numeroReserva: /^RES\d{3}$/,
    numeroCliente: /^[A-Z]{3}\d{3}$/,
    unidades: ['LS', 'PO', 'CB', 'FR', 'BR'],
    maxServicos: 4
};


app.post('/api/reservas', async (req, res) => {
    try {
        const novaReserva = req.body;


        if (!XSD_RULES.numeroReserva.test(novaReserva.numeroReserva)) {
            return res.status(400).json({
                sucesso: false,
                erro: 'Validação XSD falhou: numeroReserva deve seguir o padrão RESxxx (ex: RES001).'
            });
        }


        if (!XSD_RULES.unidades.includes(novaReserva.unidade)) {
            return res.status(400).json({
                sucesso: false,
                erro: `Validação XSD falhou: Unidade inválida. Permitido: ${XSD_RULES.unidades.join(', ')}`
            });
        }


        if (novaReserva.hospede && !XSD_RULES.numeroCliente.test(novaReserva.hospede.numeroCliente)) {
            return res.status(400).json({
                sucesso: false,
                erro: 'Validação XSD falhou: numeroCliente deve ter 3 letras e 3 números (ex: CLI123).'
            });
        }


        if (novaReserva.servicosAdicionais && novaReserva.servicosAdicionais.length > XSD_RULES.maxServicos) {
            return res.status(400).json({
                sucesso: false,
                erro: `Validação XSD falhou: Máximo de ${XSD_RULES.maxServicos} serviços adicionais permitidos.`
            });
        }

        const existe = await db.collection('reservas').findOne({ numeroReserva: novaReserva.numeroReserva });
        if (existe) {
            return res.status(409).json({ sucesso: false, erro: 'Reserva já existe com esse número.' });
        }

        const queryColisao = {
            unidade: novaReserva.unidade,
            quarto: novaReserva.quarto,
            $or: [
                {
                    checkIn: { $lt: novaReserva.checkOut },
                    checkOut: { $gt: novaReserva.checkIn }
                }
            ]
        };

        const conflito = await db.collection('reservas').findOne(queryColisao);

        if (conflito) {
            return res.status(409).json({
                sucesso: false,
                erro: `O quarto ${novaReserva.quarto} na unidade ${novaReserva.unidade} já está reservado nesse período (${conflito.checkIn} até ${conflito.checkOut}).`
            });
        }

        const resultado = await db.collection('reservas').insertOne(novaReserva);
        res.status(201).json({
            sucesso: true,
            mensagem: 'Reserva criada com sucesso!',
            dados: novaReserva
        });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});


app.put('/api/reservas/:numeroReserva', async (req, res) => {
    try {
        const { numeroReserva } = req.params;
        const updateData = req.body;
        delete updateData._id;


        if (updateData.unidade && !XSD_RULES.unidades.includes(updateData.unidade)) {
            return res.status(400).json({ sucesso: false, erro: 'Unidade inválida' });
        }

        if (updateData.servicosAdicionais && updateData.servicosAdicionais.length > XSD_RULES.maxServicos) {
            return res.status(400).json({
                sucesso: false,
                erro: `Validação XSD falhou: Máximo de ${XSD_RULES.maxServicos} serviços adicionais permitidos.`
            });
        }


        if (updateData.checkIn && updateData.checkOut && updateData.quarto && updateData.unidade) {
            const conflito = await db.collection('reservas').findOne({
                unidade: updateData.unidade,
                quarto: updateData.quarto,
                numeroReserva: { $ne: numeroReserva },
                $or: [
                    {
                        checkIn: { $lt: updateData.checkOut },
                        checkOut: { $gt: updateData.checkIn }
                    }
                ]
            });

            if (conflito) {
                return res.status(409).json({
                    sucesso: false,
                    erro: `O quarto ${updateData.quarto} já está ocupado por outra reserva (${conflito.numeroReserva}) nesse período.`
                });
            }
        }

        const resultado = await db.collection('reservas').updateOne(
            { numeroReserva: numeroReserva },
            { $set: updateData }
        );

        if (resultado.matchedCount === 0) {
            return res.status(404).json({ sucesso: false, erro: 'Reserva não encontrada para atualizar.' });
        }

        res.json({ sucesso: true, mensagem: 'Reserva atualizada com sucesso!' });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});


app.delete('/api/reservas/:numeroReserva', async (req, res) => {
    try {
        const { numeroReserva } = req.params;

        const reserva = await db.collection('reservas').findOne({ numeroReserva: numeroReserva });

        if (!reserva) {
            return res.status(404).json({ sucesso: false, erro: 'Reserva não encontrada para remover.' });
        }

        const resultado = await db.collection('reservas').deleteOne({ numeroReserva: numeroReserva });

        res.json({
            sucesso: true,
            mensagem: `Reserva ${numeroReserva} removida com sucesso.`,
            dados: reserva
        });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Servidor a correr em http://localhost:${PORT}`);
        console.log('Rotas disponíveis:');
        console.log('  GET /api/reservas');
        console.log('  GET /api/reservas/hospede/:numeroCliente');
        console.log('  GET /api/reservas/unidade');
        console.log('  GET /api/servicos/total');
        console.log('  GET /api/reservas/media');
        console.log('  GET /api/reservas/maior');
        console.log('  GET /api/reservas/:numeroReserva');
        console.log('  POST /api/reservas (XSD Validated)');
        console.log('  PUT /api/reservas/:numeroReserva');
        console.log('  DELETE /api/reservas/:numeroReserva');
        console.log('  GET /api/estatisticas');
    });
});

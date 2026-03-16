// dashboard/backend/src/services/equipamentos.service.js

import {
  listarEquipamentosRepository,
  buscarEquipamentoPorId,
  buscarEquipamentoPorCodigo,
  criarEquipamento
} from "../repositories/equipamentos.repository.js";

import {
  buscarDispositivoPorDeviceId,
  criarDispositivo
} from "../repositories/dispositivos.repository.js";

export async function listarEquipamentosService() {
  return await listarEquipamentosRepository();
}

export async function cadastrarEquipamentoService({
  nome,
  codigo,
  patrimonio = null,
  setor = null,
  descricao = null
}) {
  if (!nome || !codigo) {
    const error = new Error("Os campos 'nome' e 'codigo' são obrigatórios.");
    error.status = 400;
    throw error;
  }

  const equipamentoExistente = await buscarEquipamentoPorCodigo(codigo);
  if (equipamentoExistente) {
    const error = new Error("Já existe um equipamento cadastrado com este código.");
    error.status = 409;
    throw error;
  }

  return await criarEquipamento({
    nome,
    codigo,
    patrimonio,
    setor,
    descricao
  });
}

export async function vincularDispositivoService(equipamentoId, { device_id, descricao = null }) {
  if (!equipamentoId) {
    const error = new Error("ID do equipamento não informado.");
    error.status = 400;
    throw error;
  }

  if (!device_id) {
    const error = new Error("O campo 'device_id' é obrigatório.");
    error.status = 400;
    throw error;
  }

  const equipamento = await buscarEquipamentoPorId(equipamentoId);
  if (!equipamento) {
    const error = new Error("Equipamento não encontrado.");
    error.status = 404;
    throw error;
  }

  const dispositivoExistente = await buscarDispositivoPorDeviceId(device_id);
  if (dispositivoExistente) {
    const error = new Error("Este device_id já está vinculado a outro equipamento.");
    error.status = 409;
    throw error;
  }

  const dispositivo = await criarDispositivo({
    device_id,
    equipamento_id: Number(equipamentoId),
    descricao,
    ativo: 1
  });

  return {
    message: "Dispositivo vinculado com sucesso.",
    dispositivo,
    equipamento: {
      id: equipamento.id,
      nome: equipamento.nome,
      codigo: equipamento.codigo
    }
  };
}

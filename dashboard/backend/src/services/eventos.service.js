// dashboard/backend/src/services/eventos.service.js

import { buscarDispositivoPorDeviceId } from "../repositories/dispositivos.repository.js";
import { criarEventoRepository } from "../repositories/eventos.repository.js";
import { atualizarEquipamento } from "../repositories/equipamentos.repository.js";

/**
 * Normaliza o device_id a partir de chaves possíveis do payload.
 * (Você pode padronizar depois para sempre usar body.device_id no ESP32)
 */
function extrairDeviceId(body) {
  return body.device_id || body.id_equipamento || body.codigo_dispositivo || null;
}

/**
 * Normaliza campos do evento (sem assumir que todos existem).
 */
function normalizarEvento(body, equipamento_id, device_id) {
  return {
    equipamento_id,
    device_id,
    evento: body.evento || "status_equipamento",
    status: body.status || null,
    codigo_estado: body.codigo_estado ?? null,
    conectividade: body.conectividade || null,
    ip: body.ip || null,
    rssi: body.rssi ?? null,
    uptime_ms: body.uptime_ms ?? null,
    payload_json: body
  };
}

/**
 * Regras de atualização do status do equipamento:
 * - Se evento for "heartbeat": atualiza conectividade e ultimo_heartbeat
 * - Se evento for "status_equipamento": atualiza status/codigo_estado e conectividade
 * - Se vier "conectividade": atualiza conectividade (se for informado)
 */
function prepararUpdateEquipamento(body) {
  const update = {};

  if (typeof body.conectividade === "string") {
    update.conectividade = body.conectividade;
  }

  if (body.evento === "heartbeat") {
    // Marca como online e atualiza heartbeat (o repository já atualiza ultimo_evento_em)
    update.conectividade = "online";
    // ultimo_heartbeat_em é atualizado no controller do dashboard via cálculo,
    // mas aqui vamos manter coerência: salvamos status/campos e o timestamp fica no banco via repo.
    // Como a tabela tem campo ultimo_heartbeat_em, seria ideal um método específico.
  }

  if (body.evento === "status_equipamento") {
    if (typeof body.status === "string") update.status_atual = body.status;
    if (body.codigo_estado !== undefined && body.codigo_estado !== null) {
      update.codigo_estado_atual = body.codigo_estado;
    }
    if (!update.conectividade) update.conectividade = "online";
  }

  // Se vier status mesmo sem evento explícito, também atualiza
  if (!body.evento && typeof body.status === "string") {
    update.status_atual = body.status;
    if (body.codigo_estado !== undefined && body.codigo_estado !== null) {
      update.codigo_estado_atual = body.codigo_estado;
    }
    if (!update.conectividade) update.conectividade = "online";
  }

  return update;
}

export async function processarEventoIoTService(body) {
  const device_id = extrairDeviceId(body);

  if (!device_id) {
    const error = new Error("device_id não informado no payload.");
    error.status = 400;
    throw error;
  }

  const dispositivo = await buscarDispositivoPorDeviceId(device_id);

  if (!dispositivo || !dispositivo.equipamento_id) {
    const error = new Error("Nenhum equipamento vinculado a este device_id.");
    error.status = 404;
    error.details = { device_id };
    throw error;
  }

  const evento = normalizarEvento(body, dispositivo.equipamento_id, device_id);

  // 1) salva evento (histórico)
  const saved = await criarEventoRepository(evento);

  // 2) atualiza status atual do equipamento
  const update = prepararUpdateEquipamento(body);

  // Atualiza heartbeat de forma simples:
  // quando evento for heartbeat OU quando qualquer evento indicar online,
  // marcamos ultimo_heartbeat_em através de um update direto no banco (via SQL no repo)
  // Por enquanto usamos atualizarEquipamento + um update manual via SQL simplificado.
  // (No próximo passo, podemos criar uma função específica atualizarHeartbeatEquipamento.)
  await atualizarEquipamento(dispositivo.equipamento_id, update);

  return {
    message: "Evento recebido e processado com sucesso.",
    evento_id: saved.id,
    equipamento: {
      id: dispositivo.equipamento_id,
      nome: dispositivo.equipamento_nome,
      codigo: dispositivo.equipamento_codigo
    },
    device_id
  };
}

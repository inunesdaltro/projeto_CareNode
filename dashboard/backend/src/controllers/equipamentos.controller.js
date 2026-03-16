import db from "../config/db.js";

function isUniqueConstraint(err) {
  return String(err?.message || "").toLowerCase().includes("unique");
}

export function listarEquipamentos(req, res) {
  const sql = `
    SELECT
      e.id,
      e.nome,
      e.codigo,
      e.tipo,
      e.marca,
      e.modelo,
      e.patrimonio,
      e.setor,
      e.descricao,
      e.status_atual,
      e.codigo_estado_atual,
      e.conectividade,
      e.ultimo_evento_em,
      e.ultimo_heartbeat_em,
      d.device_id,
      d.descricao AS dispositivo_descricao
    FROM equipamentos e
    LEFT JOIN dispositivos d ON d.equipamento_id = e.id
    ORDER BY e.nome ASC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({
        error: "Erro ao listar equipamentos",
        details: err.message
      });
    }

    res.json(rows);
  });
}

export function cadastrarEquipamento(req, res) {
  const { nome, codigo, tipo, marca, modelo, patrimonio, setor, descricao } = req.body;

  if (!nome || !codigo) {
    return res.status(400).json({
      error: "Os campos 'nome' e 'codigo' são obrigatórios."
    });
  }

  const sql = `
    INSERT INTO equipamentos (
      nome,
      codigo,
      tipo,
      marca,
      modelo,
      patrimonio,
      setor,
      descricao
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    sql,
    [
      String(nome).trim(),
      String(codigo).trim(),
      tipo ? String(tipo).trim() : null,
      marca ? String(marca).trim() : null,
      modelo ? String(modelo).trim() : null,
      patrimonio ? String(patrimonio).trim() : null,
      setor ? String(setor).trim() : null,
      descricao ? String(descricao).trim() : null
    ],
    function (err) {
      if (err) {
        const status = isUniqueConstraint(err) ? 409 : 500;
        const error = isUniqueConstraint(err)
          ? "Já existe um equipamento cadastrado com este código."
          : "Erro ao cadastrar equipamento";

        return res.status(status).json({
          error,
          details: err.message
        });
      }

      res.status(201).json({
        message: "Equipamento cadastrado com sucesso.",
        id: this.lastID
      });
    }
  );
}

export function vincularDispositivo(req, res) {
  const equipamentoId = req.params.id;
  const { device_id, descricao } = req.body;

  if (!device_id) {
    return res.status(400).json({
      error: "O campo 'device_id' é obrigatório."
    });
  }

  const verificarEquipamentoSql = `
    SELECT id, nome, codigo
    FROM equipamentos
    WHERE id = ?
    LIMIT 1
  `;

  db.get(verificarEquipamentoSql, [equipamentoId], (err, equipamento) => {
    if (err) {
      return res.status(500).json({
        error: "Erro ao verificar equipamento",
        details: err.message
      });
    }

    if (!equipamento) {
      return res.status(404).json({
        error: "Equipamento não encontrado."
      });
    }

    const inserirDispositivoSql = `
      INSERT INTO dispositivos (
        device_id,
        equipamento_id,
        descricao
      )
      VALUES (?, ?, ?)
    `;

    db.run(
      inserirDispositivoSql,
      [String(device_id).trim(), equipamentoId, descricao ? String(descricao).trim() : null],
      function (insertErr) {
        if (insertErr) {
          const status = isUniqueConstraint(insertErr) ? 409 : 500;
          const error = isUniqueConstraint(insertErr)
            ? "Este device_id já está vinculado a outro equipamento."
            : "Erro ao vincular dispositivo";

          return res.status(status).json({
            error,
            details: insertErr.message
          });
        }

        res.status(201).json({
          message: "Dispositivo vinculado com sucesso.",
          dispositivo_id: this.lastID,
          equipamento: {
            id: equipamento.id,
            nome: equipamento.nome,
            codigo: equipamento.codigo
          },
          device_id: String(device_id).trim()
        });
      }
    );
  });
}

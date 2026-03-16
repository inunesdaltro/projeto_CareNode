// dashboard/frontend/src/components/equipamentos/FiltroEquipamentos.jsx

import SearchInput from "../common/SearchInput.jsx";

export default function FiltroEquipamentos({
  search,
  onSearchChange,
  total = 0,
  hint = "Digite para filtrar por nome, código, setor ou device_id."
}) {
  return (
    <div className="filter-bar">
      <div className="filter-left">
        <SearchInput
          id="equipamentos-search"
          label="Filtro"
          value={search}
          onChange={onSearchChange}
          placeholder="Ex.: BOMBA, UTI, 402, BTN-ESP32..."
        />
        <div className="filter-hint">{hint}</div>
      </div>

      <div className="filter-right">
        <span className="filter-count">{total} item(ns)</span>
      </div>
    </div>
  );
}
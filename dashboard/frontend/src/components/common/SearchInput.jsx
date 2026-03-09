// dashboard/frontend/src/components/common/SearchInput.jsx

export default function SearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
  label = "Buscar",
  id = "search-input"
}) {
  return (
    <div className="search-input">
      <label className="search-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="search-field"
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />
    </div>
  );
}
// dashboard/frontend/src/components/common/EmptyState.jsx

export default function EmptyState({
  title = "Nenhum dado encontrado",
  description = "Ainda não há informações para exibir."
}) {
  return (
    <div className="empty-state">
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
    </div>
  );
}
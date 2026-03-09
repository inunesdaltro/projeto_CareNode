// dashboard/frontend/src/components/common/LoadingState.jsx

export default function LoadingState({
  title = "Carregando...",
  description = "Aguarde um momento."
}) {
  return (
    <div className="loading-state" aria-busy="true">
      <div className="spinner" />
      <div className="loading-text">
        <div className="loading-title">{title}</div>
        <div className="loading-description">{description}</div>
      </div>
    </div>
  );
}
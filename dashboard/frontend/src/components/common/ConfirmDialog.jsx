// dashboard/frontend/src/components/common/ConfirmDialog.jsx

export default function ConfirmDialog({
  open = false,
  title = "Confirmar ação",
  message = "Tem certeza que deseja continuar?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel
}) {
  if (!open) return null;

  return (
    <div className="dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
      <div className="dialog-card">
        <h3 id="confirm-dialog-title" className="dialog-title">
          {title}
        </h3>

        <p className="dialog-message">{message}</p>

        <div className="dialog-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={onCancel}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className="button button-danger"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
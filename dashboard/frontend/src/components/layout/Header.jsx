// dashboard/frontend/src/components/layout/Header.jsx

export default function Header({
  title,
  subtitle = "",
  rightContent = null
}) {
  return (
    <header className="page-header">
      <div className="page-header-text">
        <h1 className="page-title">{title}</h1>
        {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
      </div>

      {rightContent ? (
        <div className="page-header-actions">{rightContent}</div>
      ) : null}
    </header>
  );
}
// dashboard/frontend/src/components/dashboard/MetricCard.jsx

export default function MetricCard({
  title,
  value,
  subtitle = "",
  tone = "default"
}) {
  return (
    <div className={`metric-card metric-card-${tone}`}>
      <div className="metric-card-title">{title}</div>
      <div className="metric-card-value">{value}</div>
      {subtitle ? <div className="metric-card-subtitle">{subtitle}</div> : null}
    </div>
  );
}
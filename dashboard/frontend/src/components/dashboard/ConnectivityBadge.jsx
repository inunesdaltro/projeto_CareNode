// dashboard/frontend/src/components/dashboard/ConnectivityBadge.jsx

function classByConnectivity(value) {
  const v = String(value || "").toLowerCase();

  if (v === "online" || v === "online_restabelecida") return "badge badge-online";
  if (v === "offline") return "badge badge-offline";

  return "badge badge-unknown";
}

function labelByConnectivity(value) {
  const v = String(value || "").toLowerCase();

  if (v === "online") return "Online";
  if (v === "online_restabelecida") return "Online restabelecida";
  if (v === "offline") return "Offline";

  return "Desconhecido";
}

export default function ConnectivityBadge({ value }) {
  return (
    <span className={classByConnectivity(value)}>
      {labelByConnectivity(value)}
    </span>
  );
}

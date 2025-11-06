export default function AQICard({ title, description, value, icon, color, onInfoClick }) {
  const colorClasses = {
    green: 'bg-green-100',
    orange: 'bg-orange-100',
    blue: 'bg-blue-100',
    purple: 'bg-purple-100',
    yellow: 'bg-yellow-50'
  };

  return (
    <div className={`aqi-card ${colorClasses[color]}`}>
      <div className="aqi-card-header">
        <h3>{title}</h3>
        <button onClick={onInfoClick}>I</button>
      </div>
      <p className="aqi-card-description">{description}</p>
      <div className="aqi-card-content">
        <span className="aqi-card-icon">{icon}</span>
        <span className="aqi-card-value">{value}</span>
      </div>
    </div>
  );
}
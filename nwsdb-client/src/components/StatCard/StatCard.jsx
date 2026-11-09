import './StatCard.css';

export function StatCard({ label, value, hint, tone = 'default', icon, onClick }) {
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={`stat-card stat-card--${tone} ${onClick ? 'stat-card--clickable' : ''}`}
      onClick={onClick}
    >
      <span className="stat-card__label">{label}</span>
      <span className="stat-card__value">{value}</span>
      {hint && <span className="stat-card__hint">{hint}</span>}
      {icon && <span className="stat-card__icon">{icon}</span>}
    </Tag>
  );
}

export default StatCard;

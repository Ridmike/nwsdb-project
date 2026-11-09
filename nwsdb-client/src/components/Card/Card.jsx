import './Card.css';

export function Card({
  children,
  variant = 'default', // 'default' | 'elevated' | 'bordered' | 'interactive'
  className = '',
  onClick,
  ...props
}) {
  const cardClasses = [
    'nwsdb-card',
    `nwsdb-card--${variant}`,
    onClick ? 'nwsdb-card--clickable' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses} onClick={onClick} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', action = null, ...props }) {
  return (
    <div className={`nwsdb-card__header ${className}`} {...props}>
      <div className="nwsdb-card__header-content">{children}</div>
      {action && <div className="nwsdb-card__header-action">{action}</div>}
    </div>
  );
}

export function CardTitle({ children, subtitle, className = '', ...props }) {
  return (
    <div className={`nwsdb-card__title-group ${className}`} {...props}>
      <h3 className="nwsdb-card__title">{children}</h3>
      {subtitle && <p className="nwsdb-card__subtitle">{subtitle}</p>}
    </div>
  );
}

export function CardBody({ children, className = '', noPadding = false, ...props }) {
  return (
    <div
      className={`nwsdb-card__body ${noPadding ? 'nwsdb-card__body--no-padding' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`nwsdb-card__footer ${className}`} {...props}>
      {children}
    </div>
  );
}

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;

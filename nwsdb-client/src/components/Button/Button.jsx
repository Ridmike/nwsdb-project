import './Button.css';

export function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
  size = 'md', // 'sm' | 'md' | 'lg'
  type = 'button',
  isLoading = false,
  disabled = false,
  icon = null,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  onClick,
  ...props
}) {
  const buttonClasses = [
    'nwsdb-btn',
    `nwsdb-btn--${variant}`,
    `nwsdb-btn--${size}`,
    fullWidth ? 'nwsdb-btn--full' : '',
    isLoading ? 'nwsdb-btn--loading' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading && (
        <span className="nwsdb-btn__spinner" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
          </svg>
        </span>
      )}
      {!isLoading && icon && iconPosition === 'left' && (
        <span className="nwsdb-btn__icon nwsdb-btn__icon--left">{icon}</span>
      )}
      <span className="nwsdb-btn__content">{children}</span>
      {!isLoading && icon && iconPosition === 'right' && (
        <span className="nwsdb-btn__icon nwsdb-btn__icon--right">{icon}</span>
      )}
    </button>
  );
}

export default Button;

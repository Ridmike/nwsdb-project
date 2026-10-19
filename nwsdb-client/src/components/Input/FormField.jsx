import './Input.css';

export function FormField({
  label,
  id,
  required = false,
  error = null,
  helperText = null,
  children,
  className = ''
}) {
  return (
    <div className={`nwsdb-form-field ${error ? 'nwsdb-form-field--has-error' : ''} ${className}`}>
      {label && (
        <label htmlFor={id} className="nwsdb-form-field__label">
          {label}
          {required && <span className="nwsdb-form-field__required">*</span>}
        </label>
      )}
      <div className="nwsdb-form-field__control">{children}</div>
      {error ? (
        <p className="nwsdb-form-field__error" role="alert">
          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="nwsdb-form-field__helper">{helperText}</p>
      ) : null}
    </div>
  );
}

export default FormField;

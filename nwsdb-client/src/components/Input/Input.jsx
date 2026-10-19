import { forwardRef } from 'react';
import './Input.css';

export const Input = forwardRef(function Input(
  {
    type = 'text',
    placeholder = '',
    value,
    defaultValue,
    onChange,
    disabled = false,
    readOnly = false,
    hasError = false,
    leftIcon = null,
    rightIcon = null,
    className = '',
    id,
    ...props
  },
  ref
) {
  const wrapperClasses = [
    'nwsdb-input-wrapper',
    hasError ? 'nwsdb-input-wrapper--error' : '',
    disabled ? 'nwsdb-input-wrapper--disabled' : '',
    leftIcon ? 'nwsdb-input-wrapper--has-left-icon' : '',
    rightIcon ? 'nwsdb-input-wrapper--has-right-icon' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClasses}>
      {leftIcon && <span className="nwsdb-input__icon nwsdb-input__icon--left">{leftIcon}</span>}
      <input
        ref={ref}
        id={id}
        type={type}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        disabled={disabled}
        readOnly={readOnly}
        placeholder={placeholder}
        className="nwsdb-input"
        {...props}
      />
      {rightIcon && <span className="nwsdb-input__icon nwsdb-input__icon--right">{rightIcon}</span>}
    </div>
  );
});

export default Input;

import './Input.css';

export function Select({ id, value, onChange, children, disabled = false, className = '', ...props }) {
  return (
    <div className={`nwsdb-input-wrapper nwsdb-select-wrapper ${className}`}>
      <select
        id={id}
        className="nwsdb-input nwsdb-select"
        value={value}
        onChange={onChange}
        disabled={disabled}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

export default Select;

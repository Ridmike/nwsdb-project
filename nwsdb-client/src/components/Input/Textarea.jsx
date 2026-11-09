import './Input.css';

export function Textarea({ id, value, onChange, rows = 3, disabled = false, className = '', ...props }) {
  return (
    <div className={`nwsdb-input-wrapper nwsdb-textarea-wrapper ${className}`}>
      <textarea
        id={id}
        className="nwsdb-input nwsdb-textarea"
        value={value}
        onChange={onChange}
        rows={rows}
        disabled={disabled}
        {...props}
      />
    </div>
  );
}

export default Textarea;

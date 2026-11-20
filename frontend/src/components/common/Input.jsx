export default function Input({ label, error, ...props }) {
  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <input className={`input ${error ? 'border-status-danger' : ''}`} {...props} />
      {error && <p className="mt-1 text-xs text-status-danger">{error}</p>}
    </div>
  );
}
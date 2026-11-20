import Spinner from './Spinner';

export default function Button({
  variant = 'primary',
  type = 'button',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}) {
  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
  }[variant];

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${variantClass} ${className}`}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
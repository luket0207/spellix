import './Button.css';

function Button({ children, className = '', type = 'button', variant = 'primary', ...buttonProps }) {
  const buttonClassName = [
    'fantasy-button',
    `fantasy-button--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button {...buttonProps} className={buttonClassName} type={type}>
      {children}
    </button>
  );
}

export default Button;

import './Modal.css';

function Modal({
  actions,
  ariaLabel,
  children,
  isOpen,
  onClick,
  panelClassName = '',
  variant = 'default',
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" data-testid="modal-overlay" onClick={onClick}>
      <div
        aria-label={ariaLabel}
        aria-modal="true"
        className={`modal-panel modal-panel--${variant}${
          panelClassName ? ` ${panelClassName}` : ''
        }`}
        role="dialog"
      >
        {variant === 'default' ? (
          <div className="modal-body" data-testid="modal-body">
            {children}
          </div>
        ) : (
          children
        )}
        {actions && variant === 'default' ? (
          <div className="modal-actions" data-testid="modal-actions">
            {actions}
          </div>
        ) : (
          actions
        )}
      </div>
    </div>
  );
}

export default Modal;

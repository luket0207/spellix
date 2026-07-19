import './Modal.css';

function Modal({
  actions,
  ariaLabel,
  children,
  isOpen,
  panelClassName = '',
  variant = 'default',
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" data-testid="modal-overlay">
      <div
        aria-label={ariaLabel}
        aria-modal="true"
        className={`modal-panel modal-panel--${variant}${
          panelClassName ? ` ${panelClassName}` : ''
        }`}
        role="dialog"
      >
        {children}
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

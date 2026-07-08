import './Modal.css';

function Modal({ actions, ariaLabel, children, isOpen }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" data-testid="modal-overlay">
      <div aria-label={ariaLabel} aria-modal="true" className="modal-panel" role="dialog">
        {children}
        {actions}
      </div>
    </div>
  );
}

export default Modal;

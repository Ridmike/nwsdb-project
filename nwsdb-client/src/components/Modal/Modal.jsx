import { useEffect } from 'react';
import './Modal.css';

export function Modal({
  isOpen = false,
  onClose,
  title,
  subtitle,
  children,
  footer = null,
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  closeOnBackdrop = true,
  className = ''
}) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget && closeOnBackdrop && onClose) {
      onClose();
    }
  }

  return (
    <div className="nwsdb-modal-overlay" onClick={handleBackdropClick} role="dialog" aria-modal="true">
      <div className={`nwsdb-modal nwsdb-modal--${size} ${className}`}>
        {/* Modal Header */}
        <div className="nwsdb-modal__header">
          <div className="nwsdb-modal__header-titles">
            {title && <h3 className="nwsdb-modal__title">{title}</h3>}
            {subtitle && <p className="nwsdb-modal__subtitle">{subtitle}</p>}
          </div>
          {onClose && (
            <button
              type="button"
              className="nwsdb-modal__close-btn"
              onClick={onClose}
              aria-label="Close modal"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="nwsdb-modal__body">{children}</div>

        {/* Modal Footer */}
        {footer && <div className="nwsdb-modal__footer">{footer}</div>}
      </div>
    </div>
  );
}

export default Modal;

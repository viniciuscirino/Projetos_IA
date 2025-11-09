import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

interface ConfirmationModalProps {
  show: boolean;
  title: string;
  message: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  show,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmButtonClass = 'bg-red-600 hover:bg-red-700',
}) => {
  const modalRoot = document.getElementById('modal-root');

  useEffect(() => {
    if (show && window.lucide) {
      window.lucide.createIcons();
    }
  }, [show]);

  if (!show || !modalRoot) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] fade-in-backdrop" onClick={onCancel}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md flex flex-col scale-in p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start mb-4">
          <div className="p-2 bg-red-100 rounded-full mr-4 flex-shrink-0">
            <i data-lucide="alert-triangle" className="w-6 h-6 text-red-600"></i>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{title}</h2>
            <div className="text-gray-600 mt-2 text-sm">{message}</div>
          </div>
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          <button type="button" onClick={onCancel} className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all duration-200">
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    modalRoot
  );
};

export default ConfirmationModal;

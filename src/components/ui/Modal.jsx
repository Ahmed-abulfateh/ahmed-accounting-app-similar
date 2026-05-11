import { useState } from 'react'
import { X } from 'lucide-react'

export default function Modal({ title, onClose, children, size = 'md' }) {
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className={`bg-white rounded-2xl shadow-xl w-full ${sizes[size]} max-h-[85vh] sm:max-h-[90vh] flex flex-col safe-area-inset-bottom`}>
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 min-h-14 sm:min-h-16">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{title}</h2>
          <button 
            onClick={onClose} 
            className="btn-small bg-white border border-gray-200 text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}

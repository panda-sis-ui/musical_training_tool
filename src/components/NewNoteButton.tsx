import React from 'react';

interface NewNoteButtonProps {
  onNewNote: () => void;   // функция генерации новой ноты
  label?: string;          // текст на кнопке (по умолчанию "🎲 Новая нота")
}

export default function NewNoteButton({ onNewNote, label = '🎲 Новая нота' }: NewNoteButtonProps) {
  return (
    <button
      onClick={onNewNote}
      style={{
        margin: '20px auto',
        display: 'block',
        padding: '16px 32px',
        fontSize: '22px',
        borderRadius: '8px',
        border: 'none',
        background: '#2c3e50',
        color: 'white',
        cursor: 'pointer',
        transition: 'background 0.2s, transform 0.1s',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#3e5a70')}
      onMouseLeave={(e) => (e.currentTarget.style.background = '#2c3e50')}
      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {label}
    </button>
  );
}
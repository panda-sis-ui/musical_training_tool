import React from 'react';
import styles from './IntervalSettingsModal.module.css';
import { ALL_INTERVALS } from '../lib/intervals';
import type { IntervalGameSettings } from '../types/settings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: IntervalGameSettings;
  onSave: (newSettings: IntervalGameSettings) => void;
}

export default function IntervalSettingsModal({
  isOpen,
  onClose,
  settings,
  onSave,
}: SettingsModalProps) {
  const [localSettings, setLocalSettings] = React.useState<IntervalGameSettings>(settings);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLocalSettings(settings);
    setErrorMessage(null);
  }, [settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    // Валидация: должен быть выбран хотя бы один интервал
    if (localSettings.intervalNames.length === 0) {
      setErrorMessage('Выберите хотя бы один интервал');
      return;
    }
    onSave(localSettings);
    onClose();
  };

  const toggleInterval = (name: string) => {
    setLocalSettings((prev) => {
      const newNames = prev.intervalNames.includes(name)
        ? prev.intervalNames.filter((n) => n !== name)
        : [...prev.intervalNames, name];
      return { ...prev, intervalNames: newNames };
    });
    setErrorMessage(null);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Настройки игры</h2>

        <div className={styles.section}>
          <h3>Способ ответа</h3>
          <div className={styles.radioGroup}>
            <label>
              <input
                type="radio"
                name="answerMode"
                value="buttons"
                checked={true}
                readOnly
              />
              Кнопки с названиями
            </label>
            <label>
              <input
                type="radio"
                name="answerMode"
                value="piano"
                checked={false}
                disabled
              />
              Игра на пианино (скоро)
            </label>
          </div>
        </div>

        <div className={styles.section}>
          <h3>Направление интервала</h3>
          <div className={styles.radioGroup}>
            <label>
              <input
                type="radio"
                name="direction"
                value="up"
                checked={localSettings.direction === 'up'}
                onChange={() => setLocalSettings({ ...localSettings, direction: 'up' })}
              />
              Вверх
            </label>
            <label>
              <input
                type="radio"
                name="direction"
                value="down"
                checked={localSettings.direction === 'down'}
                onChange={() => setLocalSettings({ ...localSettings, direction: 'down' })}
              />
              Вниз
            </label>
            <label>
              <input
                type="radio"
                name="direction"
                value="both"
                checked={localSettings.direction === 'both'}
                onChange={() => setLocalSettings({ ...localSettings, direction: 'both' })}
              />
              Вверх и вниз
            </label>
          </div>
        </div>

        <div className={styles.section}>
          <h3>Тоника</h3>
          <div className={styles.radioGroup}>
            <label>
              <input
                type="radio"
                name="tonic"
                value="fixed"
                checked={localSettings.tonicFixed === true}
                onChange={() => setLocalSettings({ ...localSettings, tonicFixed: true })}
              />
              Фиксированная (До)
            </label>
            <label>
              <input
                type="radio"
                name="tonic"
                value="random"
                checked={localSettings.tonicFixed === false}
                onChange={() => setLocalSettings({ ...localSettings, tonicFixed: false })}
              />
              Случайная
            </label>
          </div>
        </div>

        <div className={styles.section}>
          <h3>Доступные интервалы</h3>
          <div className={styles.checkboxGrid}>
            {ALL_INTERVALS.map((interval) => (
              <label key={interval.name} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={localSettings.intervalNames.includes(interval.name)}
                  onChange={() => toggleInterval(interval.name)}
                />
                {interval.name}
              </label>
            ))}
          </div>
        </div>

        {errorMessage && (
          <div className={styles.errorMessage} style={{ color: '#e74c3c', padding: '10px', marginBottom: '10px', borderRadius: '4px', backgroundColor: '#ffe6e6' }}>
            ⚠️ {errorMessage}
          </div>
        )}

        <div className={styles.actions}>
          <button className={styles.cancelButton} onClick={onClose}>
            Отмена
          </button>
          <button 
            className={styles.saveButton} 
            onClick={handleSave}
            disabled={localSettings.intervalNames.length === 0}
            style={{ opacity: localSettings.intervalNames.length === 0 ? 0.5 : 1, cursor: localSettings.intervalNames.length === 0 ? 'not-allowed' : 'pointer' }}
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
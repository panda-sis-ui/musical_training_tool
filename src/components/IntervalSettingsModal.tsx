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

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  if (!isOpen) return null;

  const handleSave = () => {
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
                checked={localSettings.answerMode === 'buttons'}
                onChange={() => setLocalSettings({ ...localSettings, answerMode: 'buttons' })}
              />
              Кнопки с названиями
            </label>
            <label>
              <input
                type="radio"
                name="answerMode"
                value="piano"
                checked={localSettings.answerMode === 'piano'}
                onChange={() => setLocalSettings({ ...localSettings, answerMode: 'piano' })}
              />
              Игра на пианино (скоро)
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

        <div className={styles.actions}>
          <button className={styles.cancelButton} onClick={onClose}>
            Отмена
          </button>
          <button className={styles.saveButton} onClick={handleSave}>
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
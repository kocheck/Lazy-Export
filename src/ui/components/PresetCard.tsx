import React from 'react';
import { PresetConfig } from '../../shared/types';
import './PresetCard.css';

interface PresetCardProps {
  preset: PresetConfig;
  onClick: () => void;
  disabled?: boolean;
}

export const PresetCard: React.FC<PresetCardProps> = ({ preset, onClick, disabled = false }) => {
  return (
    <button
      className={`preset-card ${disabled ? 'preset-card--disabled' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={`Apply ${preset.name} export preset`}
    >
      <div className="preset-card__icon">{preset.icon}</div>
      <div className="preset-card__name">{preset.name}</div>
      <div className="preset-card__count">{preset.settings.length}x</div>
    </button>
  );
};

import React from 'react';
import { PresetConfig } from '../../shared/types';
import './PresetCard.css';

interface PresetCardProps {
  preset: PresetConfig;
  onClick: () => void;
  disabled?: boolean;
}

export const PresetCard: React.FC<PresetCardProps> = ({ preset, onClick, disabled = false }) => {
  const [isAnimating, setIsAnimating] = React.useState(false);

  // Derive unique formats
  const formats = Array.from(new Set(preset.settings.map((s) => s.format)));

  // Format string for display (e.g. "PNG • JPG")
  // If too many, we could truncate, but 3-4 chars per badge is fine to list.
  // Let's use individual badges for a cleaner look.

  const handleClick = () => {
    if (disabled) return;
    setIsAnimating(true);
    onClick();
    setTimeout(() => setIsAnimating(false), 400); // Reset after animation
  };

  return (
    <button
      className={`preset-card ${disabled ? 'preset-card--disabled' : ''} ${isAnimating ? 'preset-card--animating' : ''}`}
      onClick={handleClick}
      disabled={disabled}
      aria-label={`Apply ${preset.name} export preset`}
    >
      <div className="preset-card__content">
        <div className="preset-card__icon">{preset.icon}</div>
        <div className="preset-card__name">{preset.name}</div>
        <div className="preset-card__badges">
          {formats.map((format) => (
            <span key={format} className={`preset-card__badge preset-card__badge--${format.toLowerCase()}`}>
              {format}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
};

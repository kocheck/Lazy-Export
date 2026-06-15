import React, { useState, useEffect, useRef } from 'react';
import { PresetConfig } from '../../shared/types';
import './PresetCard.css';

interface PresetCardProps {
  preset: PresetConfig;
  onClick: () => void;
  disabled?: boolean;
  /** Marks this card as the in-flight apply target: sets `aria-busy`. */
  busy?: boolean;
  isLastUsed?: boolean;
}

export const PresetCard: React.FC<PresetCardProps> = ({
  preset,
  onClick,
  disabled = false,
  busy = false,
  isLastUsed = false,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
    };
  }, []);

  // Derive unique formats
  const formats = Array.from(new Set(preset.settings.map((s) => s.format)));

  const handleClick = () => {
    if (disabled) return;
    setIsAnimating(true);
    onClick();
    if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
    animationTimerRef.current = setTimeout(() => setIsAnimating(false), 400);
  };

  return (
    <button
      className={`preset-card ${disabled ? 'preset-card--disabled' : ''} ${isAnimating ? 'preset-card--animating' : ''}`}
      onClick={handleClick}
      disabled={disabled}
      aria-busy={busy || undefined}
      aria-label={`Apply ${preset.name} export preset${isLastUsed ? ' (last used)' : ''}`}
    >
      <div className="preset-card__content">
        <div className="preset-card__icon">{preset.icon}</div>
        <div className="preset-card__name">{preset.name}</div>
        {isLastUsed && (
          <div className="preset-card__last-used" title="Last used preset">
            ★ Last used
          </div>
        )}
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

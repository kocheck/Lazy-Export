import React from 'react';
import './ZeroState.css';

export const ZeroState: React.FC = () => {
  return (
    <div className="zero-state">
      <div className="zero-state__illustration">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="60" cy="60" r="50" fill="var(--figma-color-bg-secondary)" />
          <path d="M45 45H75V75H45V45Z" stroke="var(--figma-color-text-tertiary)" strokeWidth="2" strokeDasharray="4 4"/>
          <path d="M60 40V50M60 70V80M40 60H50M70 60H80" stroke="var(--figma-color-text-tertiary)" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="85" cy="35" r="12" fill="var(--figma-color-bg-brand)" />
          <path d="M85 29V41M79 35H91" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <h3 className="zero-state__title">No Layers Selected</h3>
      <p className="zero-state__description">
        Select a layer in Figma to see export options.
      </p>
    </div>
  );
};

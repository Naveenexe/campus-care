import React, { useState, useEffect } from 'react';

export default function SplitFlapCounter({ value, suffix = '' }) {
  const [displayValue, setDisplayValue] = useState(String(value ?? 0));
  const [flipKey, setFlipKey] = useState(0);

  useEffect(() => {
    const nextVal = String(value ?? 0);
    setDisplayValue(nextVal);
    setFlipKey(k => k + 1);
  }, [value]);

  const chars = (displayValue + suffix).split('');

  return (
    <div className="split-flap-display" aria-label={`Counter value: ${displayValue}${suffix}`}>
      {chars.map((char, index) => (
        <div key={`${flipKey}-${index}`} className="split-flap-tile">
          <span className="split-flap-digit" style={{ animationDelay: `${index * 55}ms` }}>
            {char}
          </span>
        </div>
      ))}
    </div>
  );
}

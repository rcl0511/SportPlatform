// Logo.jsx
import React from 'react';
import '../styles/Header.css';

export default function Logo() {
  return (
    <div className="logo__iconWrap" aria-hidden>
      <svg viewBox="0 0 24 24" fill="none" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5E5BFF"/>
            <stop offset="100%" stopColor="#3E8BFF"/>
          </linearGradient>
        </defs>
        <path d="M18 7.5c0-2.2-1.9-3.5-4.6-3.5C9.7 4 8 5 8 6.8c0 4.2 8 2.2 8 6.2 0 1.9-1.9 3-4.6 3-2.7 0-4.4-1-4.4-2.8"
              stroke="url(#g)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
              vectorEffect="non-scaling-stroke" />
        <circle cx="18.2" cy="7.2" r="1.2" fill="url(#g)"/>
      </svg>
    </div>
  );
}

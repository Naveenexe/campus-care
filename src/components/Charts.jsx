import React from 'react';

// Status Donut Chart — Recolor with Registrar status palette & subtle 1px hairline strokes
export function StatusDonutChart({ statusData = {} }) {
  const config = [
    { key: 'open', label: 'Open', color: '#3C5872' },                  // --slate
    { key: 'in_progress', label: 'In Progress', color: '#A9782E' },         // --brass
    { key: 'waiting_for_student', label: 'Waiting for Student', color: '#D8B979' }, // --brass-soft
    { key: 'resolved', label: 'Resolved', color: '#5C7A52' },               // --sage
    { key: 'closed', label: 'Closed', color: '#4B5A61' },                   // --ink-soft
  ];

  const total = Object.values(statusData).reduce((a, b) => a + b, 0);

  if (total === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-soft)', fontStyle: 'italic' }}>
        No ticket records logged for this reporting period.
      </div>
    );
  }

  // Calculate slice angles
  let cumulativePercent = 0;
  const slices = config.map(item => {
    const count = statusData[item.key] || 0;
    const percent = count / total;
    const startAngle = cumulativePercent * 360;
    cumulativePercent += percent;
    const endAngle = cumulativePercent * 360;
    return { ...item, count, percent: Math.round(percent * 100), startAngle, endAngle };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
        <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          {slices.map((slice, i) => {
            if (slice.count === 0) return null;
            const strokeDasharray = `${slice.percent} ${100 - slice.percent}`;
            const strokeDashoffset = 100 - (slices.slice(0, i).reduce((sum, s) => sum + s.percent, 0));
            return (
              <circle
                key={slice.key}
                cx="18"
                cy="18"
                r="15.915"
                fill="transparent"
                stroke={slice.color}
                strokeWidth="4.2"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                style={{ strokeLinecap: 'butt' }}
              />
            );
          })}
          {/* Subtle 1px rough/hairline inner ring to give a hand-drawn ledger compass feel */}
          <circle
            cx="18"
            cy="18"
            r="13.7"
            fill="transparent"
            stroke="#C9C2AC"
            strokeWidth="0.5"
            strokeDasharray="1.5 1.5"
          />
          <circle
            cx="18"
            cy="18"
            r="18"
            fill="transparent"
            stroke="#C9C2AC"
            strokeWidth="0.5"
          />
        </svg>
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          <span className="data-mono" style={{ fontSize: '1.35rem', fontWeight: 600, color: 'var(--ink)' }}>{total}</span>
          <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            TOTAL
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flex: 1, minWidth: 160 }}>
        {slices.map(slice => (
          <div key={slice.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.825rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 9,
                height: 9,
                borderRadius: 2,
                backgroundColor: slice.color,
                border: '1px solid rgba(30, 42, 50, 0.2)'
              }} />
              <span style={{ color: 'var(--ink)' }}>{slice.label}</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <span className="data-mono" style={{ fontWeight: 600, color: 'var(--ink)' }}>{slice.count}</span>
              <span className="data-mono" style={{ color: 'var(--ink-soft)', fontSize: '0.75rem' }}>({slice.percent}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Category Distribution Bar Chart — bars styled in solid --forest with 1px hairline ledger tracks
export function CategoryBarChart({ categoryData = {} }) {
  const entries = Object.entries(categoryData);
  const max = Math.max(...entries.map(([, count]) => count), 1);

  if (entries.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-soft)', fontStyle: 'italic' }}>
        No departmental requests cataloged yet.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
      {entries.map(([name, count]) => {
        const percent = Math.round((count / max) * 100);
        return (
          <div key={name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: 4 }}>
              <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{name}</span>
              <span className="data-mono" style={{ fontWeight: 600, color: 'var(--forest)' }}>{count}</span>
            </div>
            <div style={{
              height: 9,
              background: 'var(--paper)',
              border: '1px solid var(--hairline)',
              borderRadius: 2,
              overflow: 'hidden'
            }}>
              <div
                style={{
                  height: '100%',
                  width: `${percent}%`,
                  background: 'var(--forest)',
                  borderRadius: 1,
                  boxShadow: 'inset 0 1px 0 rgba(237, 235, 224, 0.2)',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Ticket Ageing Distribution (FR-044)
// Ageing histogram bars shift --sage → --brass → --oxblood as age increases
export function AgeingDistributionChart({ ageingBins = {} }) {
  const bins = [
    { label: '< 24 Hours', value: ageingBins.under_24h || 0, color: '#5C7A52', barBg: 'var(--sage)' }, // --sage
    { label: '1 – 3 Days', value: ageingBins.one_to_three_days || 0, color: '#A9782E', barBg: 'var(--brass)' }, // --brass
    { label: '3 – 7 Days', value: ageingBins.three_to_seven_days || 0, color: '#A9782E', barBg: 'var(--brass)' }, // --brass
    { label: '> 7 Days (Ageing)', value: ageingBins.over_seven_days || 0, color: '#7A2A28', barBg: 'var(--oxblood)' }, // --oxblood
  ];

  const maxVal = Math.max(...bins.map(b => b.value), 1);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginTop: 8 }}>
      {bins.map(bin => {
        const heightPercent = Math.max(12, Math.round((bin.value / maxVal) * 100));
        return (
          <div
            key={bin.label}
            style={{
              background: 'var(--paper-raised)',
              border: '1px solid var(--hairline)',
              borderRadius: 2,
              padding: '14px 12px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: 125,
              boxShadow: 'var(--shadow-offset-sm)'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-soft)' }}>
              {bin.label}
            </div>
            <div className="data-mono" style={{ fontSize: '1.65rem', fontWeight: 600, color: bin.color, margin: '4px 0' }}>
              {bin.value}
            </div>
            <div style={{
              height: 8,
              width: '100%',
              background: 'var(--paper)',
              border: '1px solid var(--hairline)',
              borderRadius: 2,
              overflow: 'hidden'
            }}>
              <div
                style={{
                  height: '100%',
                  width: `${heightPercent}%`,
                  background: bin.barBg,
                  borderRadius: 1,
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)'
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Staff Workload Bar Chart (FR-043) — bars = --forest, overloaded = --oxblood
export function StaffWorkloadChart({ staffWorkload = [] }) {
  if (staffWorkload.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-soft)', fontStyle: 'italic' }}>
        No staff assignments currently logged in the ledger.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {staffWorkload.map(staff => {
        const isActiveHeavy = (staff.active_tickets || 0) > 4;
        return (
          <div key={staff.id} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.85rem' }}>
            <div style={{ width: 140, flexShrink: 0 }}>
              <div style={{ fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {staff.full_name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>{staff.department_name || 'General Records'}</div>
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                flex: 1,
                height: 9,
                background: 'var(--paper)',
                border: '1px solid var(--hairline)',
                borderRadius: 2,
                overflow: 'hidden',
                display: 'flex'
              }}>
                <div
                  style={{
                    width: `${Math.min(100, (staff.active_tickets || 0) * 18)}%`,
                    background: isActiveHeavy ? 'var(--oxblood)' : 'var(--forest)',
                    borderRadius: 1,
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
              <span className="data-mono" style={{
                fontWeight: 600,
                fontSize: '0.775rem',
                minWidth: 65,
                textAlign: 'right',
                color: isActiveHeavy ? 'var(--oxblood)' : 'var(--forest)'
              }}>
                {staff.active_tickets} active
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

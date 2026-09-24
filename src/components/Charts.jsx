import React from 'react';

// Status Donut Chart
export function StatusDonutChart({ statusData = {} }) {
  const config = [
    { key: 'open', label: 'Open', color: '#0284c7' },
    { key: 'in_progress', label: 'In Progress', color: '#6366f1' },
    { key: 'waiting_for_student', label: 'Waiting', color: '#f59e0b' },
    { key: 'resolved', label: 'Resolved', color: '#10b981' },
    { key: 'closed', label: 'Closed', color: '#64748b' },
  ];

  const total = Object.values(statusData).reduce((a, b) => a + b, 0);

  if (total === 0) {
    return <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>No ticket data available</div>;
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
                strokeWidth="4"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
              />
            );
          })}
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
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{total}</span>
          <span style={{ fontSize: '0.675rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Total</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 150 }}>
        {slices.map(slice => (
          <div key={slice.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.825rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: slice.color }} />
              <span style={{ color: '#475569' }}>{slice.label}</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{slice.count}</span>
              <span style={{ color: '#94a3b8' }}>({slice.percent}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Category Distribution Bar Chart
export function CategoryBarChart({ categoryData = {} }) {
  const entries = Object.entries(categoryData);
  const max = Math.max(...entries.map(([, count]) => count), 1);

  if (entries.length === 0) {
    return <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>No categories recorded</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {entries.map(([name, count]) => {
        const percent = Math.round((count / max) * 100);
        return (
          <div key={name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: 4 }}>
              <span style={{ fontWeight: 600, color: '#334155' }}>{name}</span>
              <span style={{ fontWeight: 700, color: '#2563eb' }}>{count}</span>
            </div>
            <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${percent}%`,
                  background: 'linear-gradient(90deg, #3b82f6, #6366f1)',
                  borderRadius: 4,
                  transition: 'width 0.4s ease'
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
export function AgeingDistributionChart({ ageingBins = {} }) {
  const bins = [
    { label: '< 24 Hours', value: ageingBins.under_24h || 0, color: '#10b981' },
    { label: '1 – 3 Days', value: ageingBins.one_to_three_days || 0, color: '#3b82f6' },
    { label: '3 – 7 Days', value: ageingBins.three_to_seven_days || 0, color: '#f59e0b' },
    { label: '> 7 Days (Ageing)', value: ageingBins.over_seven_days || 0, color: '#ef4444' },
  ];

  const maxVal = Math.max(...bins.map(b => b.value), 1);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginTop: 8 }}>
      {bins.map(bin => {
        const heightPercent = Math.max(15, Math.round((bin.value / maxVal) * 100));
        return (
          <div
            key={bin.label}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              padding: 12,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: 120
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>{bin.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: bin.color, margin: '6px 0' }}>{bin.value}</div>
            <div style={{ height: 6, width: '100%', background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${heightPercent}%`, background: bin.color, borderRadius: 3 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Staff Workload Bar Chart (FR-043)
export function StaffWorkloadChart({ staffWorkload = [] }) {
  if (staffWorkload.length === 0) {
    return <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>No staff data</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {staffWorkload.map(staff => (
        <div key={staff.id} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.85rem' }}>
          <div style={{ width: 140, flexShrink: 0 }}>
            <div style={{ fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {staff.full_name}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{staff.department_name || 'General'}</div>
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 10, background: '#f1f5f9', borderRadius: 5, overflow: 'hidden', display: 'flex' }}>
              <div
                style={{
                  width: `${Math.min(100, (staff.active_tickets || 0) * 15)}%`,
                  background: (staff.active_tickets || 0) > 4 ? '#ef4444' : '#2563eb',
                  borderRadius: 5,
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
            <span style={{
              fontWeight: 700,
              fontSize: '0.8rem',
              minWidth: 45,
              textAlign: 'right',
              color: (staff.active_tickets || 0) > 4 ? '#dc2626' : '#2563eb'
            }}>
              {staff.active_tickets} active
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

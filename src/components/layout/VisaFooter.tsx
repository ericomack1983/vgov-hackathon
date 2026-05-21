import { Footer, VisaLogo } from '@visa/nova-react';

const FOOTER_LINKS = ['Privacy Policy', 'Terms of Service', 'Accessibility', 'Contact Support'];

const textStyle: React.CSSProperties = {
  fontFamily: 'var(--visa-font-sans)',
  fontSize: 13,
  color: 'var(--visa-gray-500)',
  whiteSpace: 'nowrap',
};

const sepStyle: React.CSSProperties = {
  width: 1,
  height: 14,
  background: 'var(--visa-gray-200)',
  flexShrink: 0,
};

export function VisaFooter() {
  return (
    <Footer style={{ marginLeft: '16rem', display: 'block', padding: 0, background: '#fff', borderTop: 'none' }}>
      {/* Visa brand tricolor — gradient feels less chunky than hard blocks */}
      <div style={{
        height: 3,
        background: 'linear-gradient(to right, #1434CB 0%, #1434CB 54%, #f7b600 54%, #f7b600 72%, #1a1f71 72%, #1a1f71 100%)',
      }} />

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 32px',
        gap: 24,
      }}>
        {/* Left — logo · app name · copyright */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <VisaLogo style={{ height: 20 }} />
          <div style={sepStyle} />
          <span style={textStyle}>Government Procurement Portal</span>
          <div style={sepStyle} />
          <span style={textStyle}>© 2026 Visa Inc. All rights reserved.</span>
        </div>

        {/* Right — legal links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 0 }} aria-label="Footer navigation">
          {FOOTER_LINKS.map((label, i) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && <div style={sepStyle} />}
              <a
                href="#"
                style={{
                  ...textStyle,
                  textDecoration: 'none',
                  padding: i === 0 ? '0 16px 0 0' : '0 16px',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--visa-blue)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--visa-gray-500)')}
              >
                {label}
              </a>
            </span>
          ))}
        </nav>
      </div>
    </Footer>
  );
}

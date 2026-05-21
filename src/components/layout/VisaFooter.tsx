import { Footer, VisaLogo, Typography } from '@visa/nova-react';

const FOOTER_LINKS = ['Privacy Policy', 'Terms of Service', 'Accessibility', 'Contact Support'];

export function VisaFooter() {
  return (
    /* display:block + padding:0 disables .v-footer's built-in flex layout
       so children stack vertically and the bar sits flush at the top edge */
    <Footer style={{ marginLeft: '16rem', display: 'block', padding: 0 }}>

      {/* Visa brand tricolor bar — blue / gold / dark */}
      <div style={{ display: 'flex', height: 4 }}>
        <div style={{ flex: 2,   background: '#1434CB' }} />
        <div style={{ flex: 0.9, background: '#f7b600' }} />
        <div style={{ flex: 2.5, background: '#4a5568' }} />
      </div>

      {/* Content row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 24, padding: '16px 32px',
      }}>
        {/* Left — logo + tagline + copyright */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <VisaLogo />
          <div style={{ width: 1, height: 16, background: '#e5e7eb', flexShrink: 0 }} />
          <Typography tag="span" className="v-typography-body-2" style={{ color: '#6b7280', whiteSpace: 'nowrap' }}>
            Government Procurement Portal
          </Typography>
          <div style={{ width: 1, height: 16, background: '#e5e7eb', flexShrink: 0 }} />
          <Typography tag="span" className="v-typography-body-2" style={{ color: '#6b7280', whiteSpace: 'nowrap' }}>
            © 2026 Visa Inc. All rights reserved.
          </Typography>
        </div>

        {/* Right — legal links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }} aria-label="Footer">
          {FOOTER_LINKS.map((label) => (
            <Typography
              key={label}
              tag="span"
              className="v-typography-body-2"
              style={{ color: '#6b7280', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {label}
            </Typography>
          ))}
        </nav>
      </div>
    </Footer>
  );
}

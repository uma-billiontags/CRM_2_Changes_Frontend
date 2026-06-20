import { useNavigate } from 'react-router-dom';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';

export default function Campaign_Choice() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: 32 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', textAlign: 'center' }}>Create Campaign</h1>
        <p style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 4 }}>Choose how you want to create your campaign</p>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        {/* Create Your Own */}
        <div
          onClick={() => navigate('/campaign_create')}
          style={{
            width: 220, padding: '32px 24px', borderRadius: 16,
            border: '1.5px solid #e2e8f0', background: '#fff',
            cursor: 'pointer', textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = '#2563eb')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
        >
          <div style={{ width: 52, height: 52, borderRadius: 14, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <PlusOutlined style={{ fontSize: 22, color: '#2563eb' }} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Create Your Own</div>
          <div style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.6 }}>Build a campaign step by step with full control</div>
        </div>

        {/* Bulk Upload */}
        <div
          onClick={() => navigate('/bulk_campaign_create')}
          style={{
            width: 220, padding: '32px 24px', borderRadius: 16,
            border: '1.5px solid #e2e8f0', background: '#fff',
            cursor: 'pointer', textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = '#2563eb')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
        >
          <div style={{ width: 52, height: 52, borderRadius: 14, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <UploadOutlined style={{ fontSize: 22, color: '#16a34a' }} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Bulk Upload</div>
          <div style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.6 }}>Upload multiple campaigns at once via Excel</div>
        </div>
      </div>
    </div>
  );
}
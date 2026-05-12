const ComingSoon = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          maxWidth: '42rem',
          width: '100%',
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            lineHeight: '1.8',
          }}
        >
          <h1
            style={{
              fontSize: 'clamp(1.25rem, 5vw, 1.875rem)',
              fontFamily: 'serif',
              fontWeight: 500,
              color: '#111827',
              letterSpacing: '0.05em',
              marginBottom: '1rem',
              lineHeight: '1.6',
            }}
          >
            ただいまイケベジオンラインストアは
            <br />
            リニューアル準備中です。
          </h1>

          <div
            style={{
              fontSize: 'clamp(0.875rem, 3vw, 1rem)',
              color: '#374151',
              lineHeight: '1.8',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              marginTop: '1rem',
            }}
          >
            <p style={{ margin: 0 }}>
              新しいイケベジは
              <br />
              2026年1月26日（月曜日）8時〜
              <br />
              オープン予定です。
            </p>
          </div>

          <div
            style={{
              fontSize: 'clamp(0.875rem, 3vw, 1rem)',
              color: '#374151',
              lineHeight: '1.8',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              marginTop: '1.5rem',
              paddingTop: '1rem',
            }}
          >
            <p style={{ margin: 0 }}>
              ご不明点やご連絡がございましたら、
              <br />
              <a
                href="mailto:info@ikevege.com"
                style={{
                  color: '#d97706',
                  textDecoration: 'underline',
                  wordBreak: 'break-all',
                }}
              >
                info@ikevege.com
              </a>
              <br />
              までお気軽にご連絡ください。
            </p>
          </div>

          <p
            style={{
              fontSize: 'clamp(0.875rem, 3vw, 1rem)',
              color: '#374151',
              lineHeight: '1.8',
              marginTop: '2rem',
              paddingTop: '1.5rem',
              margin: '2rem 0 0 0',
            }}
          >
            オープンまで、もう少しだけお待ちください！
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;

import React, { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const CERT_WIDTH  = 794;
const CERT_HEIGHT = 1123;

function fmtDate(str) {
  if (!str) return '____________';
  const d = new Date(str);
  if (isNaN(d.getTime())) return '____________';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtDateSlash(str) {
  if (!str) return '__.__.__';
  const d = new Date(str);
  if (isNaN(d.getTime())) return '__.__.__';
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
}

const RED = '#CC0000';
const SEP = '* * * * * * * * * * * * * * * * * * * * * * * * * * * * *';
const BASE = {
  fontFamily: "'Times New Roman', Times, serif",
  fontSize: '14px',
  color: '#000',
  lineHeight: '1.85',
};

function CertBody({ formData }) {
  const {
    certificateNumber = 'AFF-2026-001',
    candidateName     = '',
    fatherName        = '',
    dob               = '',
    nationality       = '',
    passportNumber    = '',
    courseName        = '',
    webTechnologies   = [],
    courseTitle       = '',
    durationStart     = '',
    durationEnd       = '',
    hours             = '',
    issueDate         = '',
    expiryDate        = '',
    authorizedPerson  = '',
    stamp             = null,
    signature         = null,
    photo             = null,
  } = formData;

  const techString = webTechnologies.length > 0 ? webTechnologies.join(', ') : '_____________';

  return (
    <div style={{
      ...BASE,
      width:     `${CERT_WIDTH}px`,
      height:    `${CERT_HEIGHT}px`,
      backgroundColor: '#fff',
      padding:   '30px 36px',
      boxSizing: 'border-box',
      overflow:  'hidden',
    }}>
      {/* ── Border fills the full A4 page ── */}
      <div style={{
        border:         '1.5px solid #444',
        height:         '100%',
        padding:        '18px 24px',
        boxSizing:      'border-box',
        display:        'flex',
        flexDirection:  'column',
        justifyContent: 'space-between',
      }}>

        {/* ══ GROUP 1: Header + Cert Number + Separator ══ */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Spacer same width as QR */}
            <div style={{ width: '90px' }} />

            {/* Center: SYSMIC logo + title */}
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{
                display:      'inline-block',
                border:       '2.5px solid #003366',
                padding:      '8px 22px',
                marginBottom: '8px',
              }}>
                <div style={{
                  fontFamily:    "'Arial Black', Arial, sans-serif",
                  fontWeight:    '900',
                  fontSize:      '22px',
                  color:         '#003366',
                  letterSpacing: '4px',
                  lineHeight:    '1',
                }}>
                  SYSMIC
                </div>
              </div>
              <div style={{
                fontWeight:     'bold',
                fontSize:       '17px',
                textDecoration: 'underline',
                textTransform:  'uppercase',
                letterSpacing:  '3px',
                color:          '#000',
              }}>
                Course Completion
              </div>
            </div>

            {/* QR code */}
            <div style={{ textAlign: 'center', width: '90px' }}>
              <QRCodeSVG
                value={`https://verify.sysmic.in/${certificateNumber}`}
                size={82}
                fgColor="#000"
                bgColor="#fff"
              />
              <div style={{ fontSize: '7px', color: '#777', marginTop: '3px' }}>Scan to Verify</div>
            </div>
          </div>

          {/* Certificate Number */}
          <div style={{ marginTop: '10px', fontSize: '14px' }}>
            <span style={{ fontWeight: 'bold' }}>NO.:&nbsp;</span>
            <span style={{ color: RED, fontWeight: 'bold', letterSpacing: '1.5px' }}>
              {certificateNumber}
            </span>
          </div>

          {/* Separator */}
          <div style={{ color: '#aaa', fontSize: '10px', marginTop: '6px', letterSpacing: '1px' }}>{SEP}</div>
        </div>

        {/* ══ GROUP 2: Body paragraphs ══ */}
        <div>
          <p style={{ ...BASE, margin: '0 0 8px', textAlign: 'justify' }}>
            This is to certify that{' '}
            <span style={{ fontWeight: 'bold' }}>Mr./Mrs.&nbsp;</span>
            <span style={{ color: RED, fontWeight: 'bold', fontStyle: 'italic' }}>
              {candidateName.toUpperCase() || 'CANDIDATE NAME'}
            </span>
            {fatherName && (
              <>, son/daughter of <span style={{ color: RED, fontWeight: 'bold' }}>{fatherName}</span>,</>
            )}{' '}
            born on{' '}
            <span style={{ color: RED, fontWeight: 'bold' }}>{fmtDate(dob)}</span>, of{' '}
            <span style={{ color: RED, fontWeight: 'bold' }}>{nationality.toUpperCase() || 'NATIONALITY'}</span>{' '}
            nationality
            {passportNumber && (
              <>, holder of passport number{' '}
                <span style={{ color: RED, fontWeight: 'bold' }}>{passportNumber.toUpperCase()}</span>
              </>
            )}
            , has successfully completed the{' '}
            <span style={{ fontWeight: 'bold' }}>{courseName || 'Web Development Course'}</span>.
          </p>

          <p style={{ ...BASE, margin: '0 0 8px', textAlign: 'justify' }}>
            The training program covered key web technologies including{' '}
            <span style={{ fontWeight: 'bold' }}>{techString}</span>, and was completed in
            accordance with the training standards and guidelines of the institute.
          </p>

          <p style={{ ...BASE, margin: '0', textAlign: 'justify' }}>
            This certificate is awarded in recognition of the candidate's successful completion
            of the course and demonstrated knowledge in{' '}
            <span style={{ fontWeight: 'bold' }}>
              modern web development practices and technologies
            </span>.
          </p>
        </div>

        {/* ══ GROUP 3: Separator + Course Details + Conducted at ══ */}
        <div>
          <div style={{ color: '#aaa', fontSize: '10px', marginBottom: '10px', letterSpacing: '1px' }}>{SEP}</div>

          {/* Bullet list + Passport photo */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, flex: 1 }}>
              {[
                ['Course Title', courseTitle || '—'],
                ['Duration', `${durationStart ? fmtDate(durationStart) : '—'} to ${durationEnd ? fmtDate(durationEnd) : '—'}`],
                ['Hours', hours ? `${hours} Hours` : '—'],
              ].map(([label, val]) => (
                <li key={label} style={{ ...BASE, marginBottom: '4px' }}>
                  <span style={{ marginRight: '8px' }}>•</span>
                  <span style={{ fontWeight: 'bold' }}>{label} :&nbsp;</span>{val}
                </li>
              ))}
            </ul>

            {/* Passport-size photo */}
            <div style={{
              width:           '100px',
              height:          '120px',
              border:          '1px solid #888',
              flexShrink:      0,
              marginLeft:      '24px',
              backgroundColor: '#f5f5f5',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              overflow:        'hidden',
            }}>
              {photo?.dataUrl ? (
                <img
                  src={photo.dataUrl}
                  alt="Passport Photo"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ fontSize: '10px', color: '#bbb', textAlign: 'center', lineHeight: '1.5', padding: '4px' }}>
                  Passport<br />Photo
                </div>
              )}
            </div>
          </div>

          {/* Conducted at */}
          <p style={{ ...BASE, margin: '8px 0 0' }}>
            Conducted at{' '}
            <span style={{ fontWeight: 'bold' }}>SYSMIC IT Solutions.</span>
          </p>
        </div>

        {/* ══ GROUP 4: Separator + Dates ══ */}
        <div>
          <div style={{ color: '#aaa', fontSize: '10px', marginBottom: '10px', letterSpacing: '1px' }}>{SEP}</div>
          <div style={{ display: 'flex', gap: '80px' }}>
            <div style={BASE}>
              <span style={{ fontWeight: 'bold' }}>Date of Issue:&nbsp;</span>
              {fmtDateSlash(issueDate)}
            </div>
            <div style={BASE}>
              <span style={{ fontWeight: 'bold' }}>Date of Expiry:&nbsp;</span>
              {fmtDateSlash(expiryDate)}
            </div>
          </div>
        </div>

        {/* ══ GROUP 5: Footer table + verification + bottom separator ══ */}
        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                {/* Left: authorized person + stamp + signature label */}
                <td style={{
                  border:        '1px solid #555',
                  padding:       '14px 18px',
                  width:         '50%',
                  verticalAlign: 'top',
                  height:        '148px',
                }}>
                  <div style={{ ...BASE, marginBottom: '6px' }}>
                    <span style={{ fontWeight: 'bold' }}>Name of duly authorized person:&nbsp;</span>
                    <span>{authorizedPerson || '___________________'}</span>
                  </div>
                  {stamp?.dataUrl && (
                    <div style={{ margin: '8px 0' }}>
                      <img
                        src={stamp.dataUrl}
                        alt="Stamp"
                              style={{ maxHeight: '58px', maxWidth: '110px', objectFit: 'contain' }}
                      />
                    </div>
                  )}
                  <div style={{ ...BASE, marginTop: '10px', borderTop: '1px solid #ccc', paddingTop: '6px' }}>
                    <span style={{ fontWeight: 'bold' }}>Signature:</span>
                  </div>
                </td>

                {/* Right: seafarer signature */}
                <td style={{
                  border:        '1px solid #555',
                  padding:       '14px 18px',
                  width:         '50%',
                  verticalAlign: 'top',
                  height:        '148px',
                }}>
                  <div style={{ ...BASE, fontWeight: 'bold', marginBottom: '10px' }}>
                    Seafarer Signature:
                  </div>
                  {signature?.dataUrl && (
                    <div style={{ margin: '8px 0' }}>
                      <img
                        src={signature.dataUrl}
                        alt="Signature"
                              style={{ maxHeight: '58px', maxWidth: '170px', objectFit: 'contain' }}
                      />
                    </div>
                  )}
                </td>
              </tr>
            </tbody>
          </table>

          <p style={{
            ...BASE,
            fontSize:   '10px',
            color:      '#555',
            marginTop:  '8px',
            textAlign:  'center',
            lineHeight: '1.5',
          }}>
            In order to verify this document, please scan the QR Code for instant verification.
            For further information or assistance, please contact{' '}
            <span style={{ fontWeight: 'bold' }}>support@sysmic.in</span>
          </p>

          <div style={{ color: '#aaa', fontSize: '10px', marginTop: '6px', letterSpacing: '1px', textAlign: 'center' }}>
            {SEP}
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── Wrapper ─────────────────────────────────────────────────── */
export default function CertificatePreview({ formData, captureRef }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      for (const e of entries) {
        const w = e.contentRect.width;
        if (w > 0) setScale(w / CERT_WIDTH);
      }
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const scaledHeight = CERT_HEIGHT * scale;

  return (
    <div className="w-full">
      {/* Hidden full-size capture target — only rendered when captureRef is provided */}
      {captureRef && (
        <div
          style={{
            position:      'fixed',
            top:           '-9999px',
            left:          '-9999px',
            width:         `${CERT_WIDTH}px`,
            height:        `${CERT_HEIGHT}px`,
            pointerEvents: 'none',
            zIndex:        -1,
          }}
        >
          <div ref={captureRef} className="certificate-capture">
            <CertBody formData={formData} />
          </div>
        </div>
      )}

      {/* Visible scaled preview */}
      <div ref={containerRef} className="w-full" style={{ height: `${scaledHeight}px` }}>
        <div style={{
          width:           `${CERT_WIDTH}px`,
          height:          `${CERT_HEIGHT}px`,
          transformOrigin: 'top left',
          transform:       `scale(${scale})`,
          pointerEvents:   'none',
          userSelect:      'none',
        }}>
          <CertBody formData={formData} />
        </div>
      </div>
    </div>
  );
}

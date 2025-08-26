// src/components/FilePreviewPanel.jsx
import React from 'react';
import '../styles/FilePreviewPanel.css';


export default function FilePreviewPanel({
  previewImages = [],
  previewCsvs = [],
  expandedCsvs = {},
  onToggle = () => {},
}) {
  const hasNothing = previewImages.length === 0 && previewCsvs.length === 0;

  return (
    <div className="file-preview">
      {previewImages.length > 0 && (
        <div className="image-preview-group">
          <h4>이미지 미리보기</h4>
          {previewImages.map((img, idx) => (
            <img
              key={`${img.name}-${idx}`}
              src={img.src}
              alt={img.name}
              style={{ width: '100%', marginBottom: 8, display: 'block', objectFit: 'contain', maxHeight: 260 }}
            />
          ))}
        </div>
      )}

      {previewCsvs.map((csv, idx) => {
        const isExpanded = !!expandedCsvs[csv.name];
        const visibleRows = isExpanded ? csv.rows : csv.rows.slice(0, 10);

        return (
          <div key={`${csv.name}-${idx}`} style={{ marginBottom: '1rem' }}>
            <strong>{csv.name}</strong>
            <div style={{ maxHeight: 260, overflow: 'auto', border: '1px solid #eee', borderRadius: 8, marginTop: 6 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <tbody>
                  {visibleRows.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td
                          key={j}
                          title={String(cell)}
                          style={{ border: '1px solid #e9e9e9', padding: '6px 8px', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {csv.rows.length > 10 && (
              <button
                onClick={() => onToggle(csv.name)}
                style={{ marginTop: 6, padding: '6px 10px', fontSize: 12, border: '1px solid #ddd', borderRadius: 6, background: '#fff', cursor: 'pointer' }}
              >
                {isExpanded ? '간단히 보기 ▲' : '더보기 ▼'}
              </button>
            )}
          </div>
        );
      })}

      {hasNothing && <div className="no-preview">이미지 또는 CSV/엑셀 파일만 미리보기가 가능합니다.</div>}
    </div>
  );
}

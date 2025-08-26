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
        const rows = isExpanded ? csv.rows : csv.rows.slice(0, 10);

        // 첫 행을 헤더로 취급(있으면)
        const header = rows[0] || [];
        const body = rows.length > 1 ? rows.slice(1) : [];

        return (
          <div key={`${csv.name}-${idx}`} className="csv-block">
            <strong>{csv.name}</strong>

            <div className="csv-wrapper">
              <table className="csv-preview csv-preview--nowrap">
                {header.length > 0 && (
                  <thead>
                    <tr>
                      {header.map((cell, j) => (
                        <th key={j} title={String(cell)}>{String(cell)}</th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {(body.length ? body : rows).map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j} title={String(cell)}>{String(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {csv.rows.length > 10 && (
              <button className="csv-toggle-btn" onClick={() => onToggle(csv.name)}>
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

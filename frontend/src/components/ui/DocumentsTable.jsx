import { useEffect, useState } from 'react';
import { Modal } from './Modal';

function isImage(document) {
  return ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes((document.file_type || '').toLowerCase());
}

function isPdf(document) {
  return (document.file_type || '').toLowerCase() === 'pdf';
}

function previewUrl(document) {
  return `${document.file_url}#toolbar=1&navpanes=0`;
}

function openUrl(document) {
  return document.file_url;
}

export function DocumentsTable({ documents = [], title = 'Documents', description = 'Employee uploads are visible to Admin and the employee department HR.', onDelete, showEmployeeId = true }) {
  const [preview, setPreview] = useState(null);
  const [blobUrl, setBlobUrl] = useState('');

  useEffect(() => {
    if (!preview || !isImage(preview)) {
      setBlobUrl('');
      return undefined;
    }
    let active = true;
    let objectUrl = '';
    fetch(preview.file_url)
      .then((response) => response.blob())
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch(() => setBlobUrl(''));
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [preview]);

  return (
    <section className="card p-5">
      <h3 className="text-lg font-bold text-slate-950">{title}</h3>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Uploaded</th>
              <th className="px-4 py-3">File</th>
              {onDelete && <th className="px-4 py-3">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {documents.map((document) => (
              <tr key={document.id}>
                <td className="px-4 py-3">
                  <div className="font-semibold">{document.employee?.name || 'Me'}</div>
                  {showEmployeeId && document.employee && <div className="text-xs font-bold text-slate-500">ID: {document.employee.employee_code || document.user_id}</div>}
                </td>
                <td className="px-4 py-3 font-semibold">{document.file_type?.toUpperCase()}</td>
                <td className="px-4 py-3">{document.uploaded_at}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button className="btn-secondary px-3 py-2 text-blue-700" onClick={() => setPreview(document)}>
                      View
                    </button>
                    <a className="btn-secondary px-3 py-2 text-emerald-700" href={openUrl(document)} target="_blank" rel="noreferrer">Open</a>
                  </div>
                </td>
                {onDelete && (
                  <td className="px-4 py-3">
                    <button className="btn-secondary px-3 py-2 text-rose-700" onClick={() => onDelete(document)}>
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {!documents.length && (
              <tr><td className="px-4 py-6 text-center text-slate-500" colSpan={onDelete ? 5 : 4}>No documents found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {preview && (
        <Modal title={`${preview.file_type?.toUpperCase() || 'Document'} Preview`} onClose={() => setPreview(null)}>
          {isImage(preview) && (
            <div className="grid gap-3">
              <img className="mx-auto max-h-[70vh] max-w-full rounded-lg object-contain" src={blobUrl || preview.file_url} alt="Uploaded document" />
              <a className="btn-primary w-fit" href={openUrl(preview)} target="_blank" rel="noreferrer">Open Image</a>
            </div>
          )}
          {isPdf(preview) && (
            <div className="grid gap-3">
              <iframe className="h-[70vh] w-full rounded-lg border border-slate-200" src={previewUrl(preview)} title="PDF document preview" />
              <div className="flex flex-wrap gap-2">
                <a className="btn-primary w-fit" href={openUrl(preview)} target="_blank" rel="noreferrer">Open PDF</a>
                <a className="btn-secondary w-fit" href={`https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(preview.file_url)}`} target="_blank" rel="noreferrer">Open Viewer</a>
              </div>
            </div>
          )}
          {!isImage(preview) && !isPdf(preview) && (
            <div className="grid gap-4 text-sm text-slate-700">
              <p>This file type cannot be previewed inside the browser.</p>
              <a className="btn-primary w-fit" href={preview.file_url} target="_blank" rel="noreferrer">Open File</a>
            </div>
          )}
        </Modal>
      )}
    </section>
  );
}

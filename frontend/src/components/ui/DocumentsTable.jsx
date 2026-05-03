import { useState } from 'react';
import { Modal } from './Modal';

function isImage(document) {
  return ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes((document.file_type || '').toLowerCase());
}

function isPdf(document) {
  return (document.file_type || '').toLowerCase() === 'pdf';
}

export function DocumentsTable({ documents = [], title = 'Documents', description = 'Employee uploads are visible to Admin and the employee department HR.', onDelete }) {
  const [preview, setPreview] = useState(null);

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
                <td className="px-4 py-3">{document.employee?.name || 'Me'}</td>
                <td className="px-4 py-3 font-semibold">{document.file_type?.toUpperCase()}</td>
                <td className="px-4 py-3">{document.uploaded_at}</td>
                <td className="px-4 py-3">
                  <button className="btn-secondary px-3 py-2 text-blue-700" onClick={() => setPreview(document)}>
                    View
                  </button>
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
            <img className="mx-auto max-h-[70vh] max-w-full rounded-lg object-contain" src={preview.file_url} alt="Uploaded document" />
          )}
          {isPdf(preview) && (
            <iframe className="h-[70vh] w-full rounded-lg border border-slate-200" src={preview.file_url} title="Document preview" />
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

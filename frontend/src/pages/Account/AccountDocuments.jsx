import { useEffect, useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { ProfileChangePanel } from '../../components/ui/ProfileChangePanel';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { employeeService } from '../../services/employeeService';

export function AccountDocuments() {
  const { showToast } = useToast();
  const [refresh, setRefresh] = useState(0);
  const [busyAction, setBusyAction] = useState('');
  const [previewDocument, setPreviewDocument] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [blobUrl, setBlobUrl] = useState('');
  const dashboard = useAsync(employeeService.dashboard, [refresh]);

  useEffect(() => {
    if (!previewDocument || !isImage(previewDocument)) {
      setBlobUrl('');
      return undefined;
    }
    let active = true;
    let objectUrl = '';
    fetch(previewDocument.file_url)
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
  }, [previewDocument]);

  const deleteDocument = async (document) => {
    setBusyAction(`delete-document-${document.id}`);
    try {
      await employeeService.deleteDocument(document.id);
      showToast('Document deleted successfully.');
      setRefresh((value) => value + 1);
    } catch (error) {
      showToast(error.response?.data?.message || 'Document delete failed.', 'error');
    } finally {
      setBusyAction('');
    }
  };

  return (
    <div className="space-y-6">
      <ProfileChangePanel
        activeTab="documents"
        data={dashboard.data}
        busyAction={busyAction}
        onRefresh={() => setRefresh((value) => value + 1)}
        onPreviewDocument={setPreviewDocument}
        onDeleteDocument={setDeleteTarget}
      />
      {previewDocument && (
        <Modal title={`${previewDocument.file_type?.toUpperCase() || 'Document'} Preview`} onClose={() => setPreviewDocument(null)}>
          {isImage(previewDocument) && (
            <div className="grid gap-3">
              <img className="mx-auto max-h-[70vh] max-w-full rounded-lg object-contain" src={blobUrl || previewDocument.file_url} alt="Uploaded document" />
              <a className="btn-primary w-fit" href={previewDocument.file_url} target="_blank" rel="noreferrer">Open Image</a>
            </div>
          )}
          {isPdf(previewDocument) && (
            <div className="grid gap-3">
              <iframe className="h-[70vh] w-full rounded-lg border border-slate-200" src={previewUrl(previewDocument)} title="PDF document preview" />
              <div className="flex flex-wrap gap-2">
                <a className="btn-primary w-fit" href={previewDocument.file_url} target="_blank" rel="noreferrer">Open PDF</a>
                <a className="btn-secondary w-fit" href={`https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(previewDocument.file_url)}`} target="_blank" rel="noreferrer">Open Viewer</a>
              </div>
            </div>
          )}
          {!isImage(previewDocument) && !isPdf(previewDocument) && (
            <div className="grid gap-4 text-sm text-slate-700">
              <p>This file type cannot be previewed inside the browser.</p>
              <a className="btn-primary w-fit" href={previewDocument.file_url} target="_blank" rel="noreferrer">Open File</a>
            </div>
          )}
        </Modal>
      )}
      {deleteTarget && (
        <Modal
          title="Delete Document"
          onClose={() => setDeleteTarget(null)}
          footer={(
            <>
              <button className="btn-secondary" onClick={() => setDeleteTarget(null)} type="button">Cancel</button>
              <button className="btn-primary bg-rose-600 hover:bg-rose-700" onClick={() => { deleteDocument(deleteTarget); setDeleteTarget(null); }} type="button">Delete</button>
            </>
          )}
        >
          <p className="text-sm font-semibold text-slate-600">Delete this document from your account?</p>
        </Modal>
      )}
    </div>
  );
}

function isImage(document) {
  return ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes((document.file_type || '').toLowerCase());
}

function isPdf(document) {
  return (document.file_type || '').toLowerCase() === 'pdf';
}

function previewUrl(document) {
  return `${document.file_url}#toolbar=1&navpanes=0`;
}

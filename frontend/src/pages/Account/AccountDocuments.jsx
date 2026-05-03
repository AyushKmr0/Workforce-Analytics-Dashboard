import { useState } from 'react';
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
  const dashboard = useAsync(employeeService.dashboard, [refresh]);

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
        onDeleteDocument={deleteDocument}
      />
      {previewDocument && (
        <Modal title={`${previewDocument.file_type?.toUpperCase() || 'Document'} Preview`} onClose={() => setPreviewDocument(null)}>
          {isImage(previewDocument) && <img className="mx-auto max-h-[70vh] max-w-full rounded-lg object-contain" src={previewDocument.file_url} alt="Uploaded document" />}
          {isPdf(previewDocument) && <iframe className="h-[70vh] w-full rounded-lg border border-slate-200" src={previewDocument.file_url} title="Document preview" />}
          {!isImage(previewDocument) && !isPdf(previewDocument) && (
            <div className="grid gap-4 text-sm text-slate-700">
              <p>This file type cannot be previewed inside the browser.</p>
              <a className="btn-primary w-fit" href={previewDocument.file_url} target="_blank" rel="noreferrer">Open File</a>
            </div>
          )}
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

import { useState } from 'react';
import { DocumentsTable } from '../../components/ui/DocumentsTable';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { adminService } from '../../services/adminService';

export function AdminDocuments() {
  const { showToast } = useToast();
  const [refresh, setRefresh] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const documents = useAsync(adminService.documents, [refresh]);

  const deleteDocument = async (document) => {
    try {
      await adminService.deleteDocument(document.id);
      showToast('Document deleted successfully.');
      setRefresh((value) => value + 1);
    } catch (error) {
      showToast(error.response?.data?.message || 'Document delete failed.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-blue-600">Documents</p>
        <h2 className="text-3xl font-black tracking-tight text-slate-950">Employee Documents</h2>
      </div>
      {documents.error && <div className="rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-700">{documents.error}</div>}
      <DocumentsTable documents={documents.data?.items || []} title="Employee Documents" onDelete={setDeleteTarget} />
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
          <p className="text-sm font-semibold text-slate-600">Delete this document for {deleteTarget.employee?.name || 'this employee'}?</p>
        </Modal>
      )}
    </div>
  );
}

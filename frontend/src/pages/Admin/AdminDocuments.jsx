import { useState } from 'react';
import { DocumentsTable } from '../../components/ui/DocumentsTable';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { adminService } from '../../services/adminService';

export function AdminDocuments() {
  const { showToast } = useToast();
  const [refresh, setRefresh] = useState(0);
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
      <DocumentsTable documents={documents.data?.items || []} title="Employee Documents" onDelete={deleteDocument} />
    </div>
  );
}

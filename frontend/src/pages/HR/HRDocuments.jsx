import { useState } from 'react';
import { DocumentsTable } from '../../components/ui/DocumentsTable';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { hrService } from '../../services/hrService';

export function HRDocuments() {
  const { showToast } = useToast();
  const [refresh, setRefresh] = useState(0);
  const documents = useAsync(hrService.documents, [refresh]);

  const deleteDocument = async (document) => {
    try {
      await hrService.deleteDocument(document.id);
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
        <h2 className="text-3xl font-black tracking-tight text-slate-950">Department Documents</h2>
      </div>
      <DocumentsTable documents={documents.data?.items || []} title="Department Documents" onDelete={deleteDocument} />
    </div>
  );
}

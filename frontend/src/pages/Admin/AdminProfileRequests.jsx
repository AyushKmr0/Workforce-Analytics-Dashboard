import { useState } from 'react';
import { ProfileChangeReview } from '../../components/ui/ProfileChangeReview';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { adminService } from '../../services/adminService';

export function AdminProfileRequests() {
  const { showToast } = useToast();
  const [refresh, setRefresh] = useState(0);
  const profileRequests = useAsync(() => adminService.profileChangeRequests(), [refresh]);

  const reviewProfileRequest = async (id, status) => {
    try {
      await adminService.reviewProfileChangeRequest(id, status);
      showToast(`Profile request ${status.toLowerCase()}.`);
      setRefresh((value) => value + 1);
    } catch (error) {
      showToast(error.response?.data?.message || 'Profile request review failed.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-blue-600">Approvals</p>
        <h2 className="text-3xl font-black tracking-tight text-slate-950">Profile Change Requests</h2>
      </div>
      <ProfileChangeReview title="Profile Changes Pending Admin Review" requests={profileRequests.data?.items || []} onReview={reviewProfileRequest} />
    </div>
  );
}

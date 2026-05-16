import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { employeeService } from '../../services/employeeService';
import { StatusBadge } from './StatusBadge';
import { Modal } from './Modal';

export function ProfileChangePanel({ data, busyAction, onRefresh, onPreviewDocument, onDeleteDocument, activeTab = 'profile' }) {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [saving, setSaving] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [documentFile, setDocumentFile] = useState(null);
  const [confirmAction, setConfirmAction] = useState('');
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
    address: user?.address || '',
    city: user?.city || '',
    district: user?.district || '',
    state: user?.state || '',
    pincode: user?.pincode || '',
    date_of_birth: user?.date_of_birth || '',
    joining_date: user?.joining_date || '',
  });
  const [password, setPassword] = useState({ password: '', confirm: '' });
  const avatarRef = useRef(null);
  const documentRef = useRef(null);
  const requests = useAsync(employeeService.profileChangeRequests, [saving]);
  const ownProfile = useAsync(employeeService.dashboard, [saving]);
  const sourceData = data || ownProfile.data;
  const profile = sourceData?.user || user;
  const documents = sourceData?.documents || [];

  useEffect(() => {
    setForm({
      name: profile?.name || '',
      email: profile?.email || '',
      phone_number: profile?.phone_number || '',
      address: profile?.address || '',
      city: profile?.city || '',
      district: profile?.district || '',
      state: profile?.state || '',
      pincode: profile?.pincode || '',
      date_of_birth: profile?.date_of_birth || '',
      joining_date: profile?.joining_date || '',
    });
  }, [
    profile?.id,
    profile?.name,
    profile?.email,
    profile?.phone_number,
    profile?.address,
    profile?.city,
    profile?.district,
    profile?.state,
    profile?.pincode,
    profile?.date_of_birth,
    profile?.joining_date,
  ]);

  const avatarPreview = useMemo(() => {
    if (avatar) return URL.createObjectURL(avatar);
    return profile?.profile_image || '';
  }, [avatar, profile?.profile_image]);

  const requestProfileSave = (event) => {
    event.preventDefault();
    setConfirmAction('profile');
  };

  const submitProfile = async () => {
    setSaving('profile');
    try {
      const payload = { ...form };
      if (avatar) payload.profile_image = avatar;
      const response = await employeeService.updateProfile(payload);
      if (response.user) {
        updateUser(response.user);
        showToast('Profile updated.');
      } else {
        showToast(response.message || 'Profile change request submitted for approval.');
      }
      setAvatar(null);
      if (avatarRef.current) avatarRef.current.value = '';
      onRefresh?.();
    } catch (error) {
      showToast(error.response?.data?.message || 'Profile update failed.', 'error');
    } finally {
      setSaving('');
    }
  };

  const requestPasswordSave = (event) => {
    event.preventDefault();
    if (password.password !== password.confirm) {
      showToast('Password confirmation does not match.', 'error');
      return;
    }
    setConfirmAction('password');
  };

  const submitPassword = async () => {
    setSaving('password');
    try {
      await employeeService.updatePassword({ password: password.password });
      showToast('Password updated.');
      setPassword({ password: '', confirm: '' });
    } catch (error) {
      showToast(error.response?.data?.message || 'Password update failed.', 'error');
    } finally {
      setSaving('');
    }
  };

  const requestDocumentUpload = (event) => {
    event.preventDefault();
    if (!documentFile) {
      showToast('Choose a document first.', 'info');
      return;
    }
    setConfirmAction('document');
  };

  const uploadDocument = async () => {
    setSaving('document');
    try {
      await employeeService.uploadDocument(documentFile);
      showToast('Document uploaded successfully.');
      setDocumentFile(null);
      if (documentRef.current) documentRef.current.value = '';
      onRefresh?.();
    } catch (error) {
      showToast(error.response?.data?.message || 'Document upload failed.', 'error');
    } finally {
      setSaving('');
    }
  };

  return (
    <section className="card p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-slate-50 p-4">
        <div className="flex items-center gap-3">
          <AvatarPreview src={avatarPreview} name={profile?.name} />
          <div>
            <h3 className="text-lg font-black text-slate-950">{profile?.name || 'My Profile'}</h3>
            <p className="text-sm font-medium text-slate-500">{profile?.email}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <InfoPill label="Code" value={profile?.employee_code || '-'} />
          <InfoPill label="Joined" value={profile?.joining_date || '-'} />
          <InfoPill label="Docs" value={documents.length} />
          <StatusBadge value={profile?.status || 'ACTIVE'} />
        </div>
      </div>

      <div className="min-h-[440px]">
          {activeTab === 'profile' && (
            <form className="grid gap-4" onSubmit={requestProfileSave}>
              <SectionHeading title="Update Profile" subtitle={approvalSubtitle(profile?.role)} />
              <div className="flex flex-wrap items-center gap-4 rounded-lg bg-slate-50 p-4">
                <AvatarPreview src={avatarPreview} name={form.name} large />
                <label className="btn-secondary">
                  <Camera size={18} />
                  Change Avatar
                  <input ref={avatarRef} className="hidden" type="file" accept=".png,.jpg,.jpeg" onChange={(event) => setAvatar(event.target.files?.[0] || null)} />
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
                <Field label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} required />
                <Field label="Phone" value={form.phone_number} onChange={(value) => setForm({ ...form, phone_number: value })} />
                <Field label="Date of Birth" type="date" value={form.date_of_birth || ''} onChange={(value) => setForm({ ...form, date_of_birth: value })} />
                <ReadOnly label="Role" value={profile?.role || '-'} />
                <ReadOnly label="Joining Date" value={profile?.joining_date || '-'} />
                <label className="grid gap-1.5 text-sm font-semibold text-slate-700 md:col-span-2">
                  <span>Address Line</span>
                  <textarea className="field" rows="3" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
                </label>
                <Field label="City" value={form.city} onChange={(value) => setForm({ ...form, city: value })} />
                <Field label="District" value={form.district} onChange={(value) => setForm({ ...form, district: value })} />
                <Field label="State" value={form.state} onChange={(value) => setForm({ ...form, state: value })} />
                <Field label="Pincode" value={form.pincode} onChange={(value) => setForm({ ...form, pincode: value })} />
              </div>
              <button className="btn-primary w-fit" disabled={Boolean(saving)}>
                {saving === 'profile' ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          )}

          {activeTab === 'documents' && (
            <div className="grid gap-4">
              <SectionHeading title="Documents" subtitle="Upload and view employee documents separately from profile updates." />
              <form className="flex flex-wrap gap-3 rounded-lg bg-slate-50 p-4" onSubmit={requestDocumentUpload}>
                <input ref={documentRef} className="field min-w-64 flex-1" type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" onChange={(event) => setDocumentFile(event.target.files?.[0] || null)} />
                <button className="btn-primary" disabled={Boolean(saving) || Boolean(busyAction)}>
                  <Upload size={18} />
                  {saving === 'document' ? 'Uploading...' : 'Upload'}
                </button>
              </form>
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {documents.length === 0 && <div className="p-5 text-sm font-semibold text-slate-500">No documents uploaded yet.</div>}
                {documents.map((item) => (
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4" key={item.id}>
                    <div>
                      <div className="font-bold text-slate-950">{item.file_type?.toUpperCase()} Document</div>
                      <div className="text-sm text-slate-500">{item.uploaded_at}</div>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-secondary px-3 py-2 text-blue-700" onClick={() => onPreviewDocument?.(item)} type="button">View</button>
                      <button className="btn-secondary px-3 py-2 text-rose-700" disabled={Boolean(busyAction)} onClick={() => onDeleteDocument?.(item)} type="button">
                        {busyAction === `delete-document-${item.id}` ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <form className="max-w-xl space-y-4" onSubmit={requestPasswordSave}>
              <SectionHeading title="Security" subtitle="Password changes are saved directly without HR/Admin approval." />
              <Field label="New Password" type="password" value={password.password} onChange={(value) => setPassword({ ...password, password: value })} required />
              <Field label="Confirm Password" type="password" value={password.confirm} onChange={(value) => setPassword({ ...password, confirm: value })} required />
              <button className="btn-primary" disabled={Boolean(saving)}>
                {saving === 'password' ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}

          {activeTab === 'activity' && (
            <div className="grid gap-4">
              <SectionHeading title="Update History" subtitle="Older approval requests remain visible for reference." />
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {(requests.data?.items || []).length === 0 && <div className="p-5 text-sm font-semibold text-slate-500">No previous profile requests.</div>}
                {(requests.data?.items || []).slice(0, 8).map((item) => (
                  <div className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm" key={item.id}>
                    <div>
                      <span className="font-bold text-slate-950">Request #{item.id}</span>
                      <p className="text-slate-500">{item.created_at}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-700">{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>
      {confirmAction && (
        <Modal
          title={confirmTitle(confirmAction)}
          onClose={() => setConfirmAction('')}
          footer={(
            <>
              <button className="btn-secondary" onClick={() => setConfirmAction('')} type="button">Cancel</button>
              <button
                className="btn-primary"
                onClick={() => {
                  const action = confirmAction;
                  setConfirmAction('');
                  if (action === 'profile') submitProfile();
                  if (action === 'password') submitPassword();
                  if (action === 'document') uploadDocument();
                }}
                type="button"
              >
                Confirm
              </button>
            </>
          )}
        >
          <p className="text-sm font-semibold text-slate-600">{confirmMessage(confirmAction)}</p>
        </Modal>
      )}
    </section>
  );
}

function SectionHeading({ title, subtitle }) {
  return (
    <div>
      <h3 className="text-xl font-black text-slate-950">{title}</h3>
      <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>
    </div>
  );
}

function approvalSubtitle(role) {
  if (role === 'ADMIN') return 'Admin profile changes save directly. Password changes stay in Security.';
  if (role === 'HR') return 'Profile changes are sent to Admin for approval. Password changes stay in Security.';
  return 'Profile changes are sent to HR for approval. Password changes stay in Security.';
}

function confirmTitle(action) {
  if (action === 'password') return 'Update Password';
  if (action === 'document') return 'Upload Document';
  return 'Submit Profile Update';
}

function confirmMessage(action) {
  if (action === 'password') return 'Confirm password update for this account.';
  if (action === 'document') return 'Confirm document upload.';
  return 'Confirm profile update request. Password changes are handled separately.';
}

function Field({ label, type = 'text', value, onChange, required }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
      <span>{label}</span>
      <input className="field" type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} />
    </label>
  );
}

function ReadOnly({ label, value }) {
  return (
    <div className="grid gap-1.5 text-sm font-semibold text-slate-700">
      <span>{label}</span>
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-500">{value}</div>
    </div>
  );
}

function InfoPill({ label, value }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 font-bold text-slate-700 ring-1 ring-slate-200">
      <span className="text-slate-400">{label}</span>
      {value}
    </span>
  );
}

function AvatarPreview({ src, name, large = false }) {
  const size = large ? 'h-20 w-20 text-xl' : 'h-14 w-14 text-base';
  if (src) {
    return <img className={`${size} shrink-0 rounded-full object-cover ring-2 ring-white/50`} src={src} alt={name || 'Profile'} />;
  }
  const initials = (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  return (
    <div className={`${size} grid shrink-0 place-items-center rounded-full bg-blue-100 font-black text-blue-700 ring-2 ring-white/50`}>
      {initials}
    </div>
  );
}

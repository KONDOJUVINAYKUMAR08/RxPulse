import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, UserCheck, UserX } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../../components/common/Navbar';
import { getAllUsers, updateUser, deleteUser, registerUser } from '../../api/authApi';
import { getRoleBadgeClass, getRoleLabel } from '../../utils/roleHelpers';
import { useAuth } from '../../context/AuthContext';
import { X } from 'lucide-react';

const defaultForm = { name: '', email: '', password: '', role: 'pharmacist', department: 'General', phone: '', isActive: true };

const UserModal = ({ user, onClose, onSave, loading }) => {
  const [form, setForm] = useState(user ? { ...user, password: '' } : defaultForm);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => { e.preventDefault(); onSave(form); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">{user ? 'Edit User' : 'Add User'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="form-label">Full Name *</label>
            <input name="name" value={form.name} onChange={handleChange} required className="form-input" placeholder="Full name" />
          </div>
          <div>
            <label className="form-label">Email *</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required className="form-input" placeholder="email@example.com" disabled={!!user} />
          </div>
          <div>
            <label className="form-label">{user ? 'New Password (leave blank to keep current)' : 'Password *'}</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} required={!user} className="form-input" placeholder="••••••••" autoComplete="new-password" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Role *</label>
              <select name="role" value={form.role} onChange={handleChange} className="form-input">
                <option value="pharmacist">Pharmacist</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="form-label">Department</label>
              <input name="department" value={form.department} onChange={handleChange} className="form-input" placeholder="e.g. General" />
            </div>
          </div>
          <div>
            <label className="form-label">Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} className="form-input" placeholder="Phone number" />
          </div>
          {user && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} className="w-4 h-4 accent-blue-500" />
              <span className="text-sm text-slate-700">Account Active</span>
            </label>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving…' : user ? 'Save Changes' : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | user object
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getAllUsers();
      setUsers(res.data.data || []);
    } catch { toast.error('Failed to load users.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (modal === 'add') {
        await registerUser(form);
        toast.success('User created successfully.');
      } else {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await updateUser(modal._id, payload);
        toast.success('User updated.');
      }
      setModal(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (id === currentUser?._id) { toast.error("You can't delete your own account."); return; }
    if (!window.confirm('Delete this user permanently?')) return;
    try {
      await deleteUser(id);
      toast.success('User deleted.');
      fetchUsers();
    } catch { toast.error('Failed to delete user.'); }
  };

  const handleToggleActive = async (user) => {
    try {
      await updateUser(user._id, { isActive: !user.isActive });
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}.`);
      fetchUsers();
    } catch { toast.error('Failed to update user status.'); }
  };

  return (
    <div>
      <Navbar title="User Management" subtitle="Manage system users and access roles" />
      <div className="page-container">
        <div className="flex justify-between items-center mb-5">
          <p className="text-sm text-slate-500">{users.length} user{users.length !== 1 ? 's' : ''} registered</p>
          <button onClick={() => setModal('add')} className="btn-primary">
            <Plus className="w-4 h-4" /> Add User
          </button>
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header">Name</th>
                    <th className="table-header">Email</th>
                    <th className="table-header">Role</th>
                    <th className="table-header">Department</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-blue-600">{u.name?.charAt(0)?.toUpperCase()}</span>
                          </div>
                          <span className="font-medium text-slate-800">{u.name}</span>
                          {u._id === currentUser?._id && <span className="badge badge-blue">You</span>}
                        </div>
                      </td>
                      <td className="table-cell text-slate-500">{u.email}</td>
                      <td className="table-cell">
                        <span className={`badge ${getRoleBadgeClass(u.role)}`}>{getRoleLabel(u.role)}</span>
                      </td>
                      <td className="table-cell">{u.department || '—'}</td>
                      <td className="table-cell">
                        <span className={u.isActive ? 'badge badge-green' : 'badge badge-slate'}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setModal(u)} className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleToggleActive(u)} className={`p-1.5 rounded-lg transition-colors ${u.isActive ? 'hover:bg-red-50 text-slate-400 hover:text-red-600' : 'hover:bg-green-50 text-slate-400 hover:text-green-600'}`} title={u.isActive ? 'Deactivate' : 'Activate'}>
                            {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                          {u._id !== currentUser?._id && (
                            <button onClick={() => handleDelete(u._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modal !== null && (
        <UserModal
          user={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
          loading={saving}
        />
      )}
    </div>
  );
};

export default UserManagement;

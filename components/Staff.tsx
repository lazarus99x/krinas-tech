import React, { useState } from 'react';
import { User, ActivityLog, UserRole } from '../types';
import { UserPlus, Search, Edit2, Trash2, Shield, Activity, X, Check, Lock, Ban, Key, Mail, RefreshCcw } from 'lucide-react';

interface StaffProps {
  users: User[];
  logs: ActivityLog[];
  onAddUser: (u: User) => void;
  onUpdateUser: (u: User) => void;
  onDeleteUser: (id: string) => void;
}

export const Staff: React.FC<StaffProps> = ({ users, logs, onAddUser, onUpdateUser, onDeleteUser }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    password: '',
    role: 'SALES_REP',
    isActive: true
  });

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLogs = logs.filter(l => 
    l.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({ ...user, password: '' }); // Don't show password, allow reset
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'SALES_REP',
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleToggleStatus = (user: User) => {
      const action = user.isActive ? 'ban' : 'activate';
      if (confirm(`Are you sure you want to ${action} ${user.name}?`)) {
          onUpdateUser({ ...user, isActive: !user.isActive });
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      // If password field is empty, keep old password
      const updatedUser = { 
        ...editingUser, 
        ...formData, 
        password: formData.password ? formData.password : editingUser.password 
      } as User;
      onUpdateUser(updatedUser);
    } else {
      if (!formData.password) {
        alert("Password is required for new users");
        return;
      }
      onAddUser({ ...formData, id: Date.now().toString() } as User);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex bg-brand-surface p-1 rounded-xl shadow-sm border border-gray-800">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'users' 
              ? 'bg-brand-gold text-white shadow-md' 
              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            Staff Management
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'logs' 
              ? 'bg-brand-gold text-white shadow-md' 
              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            Activity Logs
          </button>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
           <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder={activeTab === 'users' ? "Search staff..." : "Search logs..."}
                className="w-full pl-10 pr-4 py-2.5 bg-brand-surface border border-gray-700 rounded-xl outline-none focus:border-brand-gold text-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
           {activeTab === 'users' && (
             <button 
               onClick={() => handleOpenModal()}
               className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
             >
               <UserPlus size={18} /> Add Staff
             </button>
           )}
        </div>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map(user => (
            <div key={user.id} className={`bg-brand-surface p-5 rounded-2xl border shadow-sm flex flex-col hover:shadow-md transition-shadow ${!user.isActive ? 'border-red-200 dark:border-red-900/50 opacity-75' : 'border-gray-800'}`}>
               <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        user.role === 'ADMIN' ? 'bg-purple-600' :
                        user.role === 'SALES_REP' ? 'bg-green-600' : 'bg-orange-600'
                     }`}>
                        {user.name.charAt(0).toUpperCase()}
                     </div>
                     <div>
                       <h3 className="font-bold text-brand-text">{user.name}</h3>
                       <p className="text-xs text-brand-muted">{user.email}</p>
                     </div>
                  </div>
                  <button 
                    onClick={() => handleToggleStatus(user)}
                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors ${
                     user.isActive 
                     ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200' 
                     : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200'
                  }`}
                  title={user.isActive ? "Click to Ban" : "Click to Activate"}
                  >
                    {user.isActive ? <Check size={10} /> : <Ban size={10} />}
                    {user.isActive ? 'Active' : 'Banned'}
                  </button>
               </div>
               
               <div className="flex-1 space-y-2 mb-4">
                 <div className="flex items-center gap-2 text-sm text-brand-text/70">
                    <Shield size={16} className="text-gray-400" />
                    <span>{user.role.replace('_', ' ')}</span>
                 </div>
                 {user.lastLogin && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Activity size={14} />
                      <span>Last login: {new Date(user.lastLogin).toLocaleDateString()}</span>
                    </div>
                 )}
               </div>

               <div className="pt-4 border-t border-gray-50 dark:border-gray-700 flex justify-end gap-2">
                 <button 
                    onClick={() => handleOpenModal(user)} 
                    className="p-2 text-brand-gold hover:bg-brand-gold/5 hover:bg-brand-gold-dark/20 rounded-lg flex items-center gap-1 text-xs font-medium"
                    title="Edit Details & Reset Password"
                 >
                   <Edit2 size={16} /> Edit
                 </button>
                 <button 
                    onClick={() => handleToggleStatus(user)}
                    className={`p-2 rounded-lg flex items-center gap-1 text-xs font-medium transition-colors ${user.isActive ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20' : 'text-green-600 hover:bg-green-50'}`}
                    title={user.isActive ? "Ban User" : "Unban User"}
                 >
                    {user.isActive ? <Ban size={16} /> : <Check size={16} />}
                 </button>
                 <button onClick={() => onDeleteUser(user.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                     <Trash2 size={16} />
                 </button>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="bg-brand-surface rounded-2xl border border-gray-800 shadow-sm overflow-hidden">
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
               <thead className="bg-gray-50 dark:bg-gray-700/50 text-brand-muted border-b border-gray-800">
                 <tr>
                   <th className="px-6 py-4 font-medium">Timestamp</th>
                   <th className="px-6 py-4 font-medium">User</th>
                   <th className="px-6 py-4 font-medium">Action</th>
                   <th className="px-6 py-4 font-medium">Details</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                 {filteredLogs.map(log => (
                   <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                     <td className="px-6 py-4 text-brand-muted whitespace-nowrap">
                       {new Date(log.timestamp).toLocaleString()}
                     </td>
                     <td className="px-6 py-4 font-medium text-brand-text">
                       {log.userName}
                     </td>
                     <td className="px-6 py-4 text-brand-gold text-brand-gold font-medium">
                       {log.action}
                     </td>
                     <td className="px-6 py-4 text-brand-text/70">
                       {log.details}
                     </td>
                   </tr>
                 ))}
                 {filteredLogs.length === 0 && (
                   <tr>
                     <td colSpan={4} className="px-6 py-12 text-center text-gray-400">No logs found</td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-brand-surface w-full max-w-md rounded-2xl shadow-2xl animate-fade-in-up">
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-brand-text">{editingUser ? 'Edit User & Reset Credentials' : 'Add New Staff'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
               
               <div>
                  <label className="block text-sm font-medium text-brand-text/80 mb-1">Full Name</label>
                  <input required type="text" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-gold/20" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
               </div>

               {/* Role Selection */}
               <div>
                  <label className="block text-sm font-medium text-brand-text/80 mb-1">Role</label>
                  <select className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-gold/20" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                    <option value="ADMIN">Administrator</option>
                    <option value="SALES_REP">Sales Representative</option>
                    <option value="INVENTORY_REP">Inventory Representative</option>
                  </select>
               </div>

               {/* Credentials Section */}
               <div className="p-4 bg-brand-gold/5 bg-brand-gold-dark/10 rounded-xl border border-blue-100 dark:border-blue-900/30 space-y-4">
                 <div className="flex items-center gap-2 text-blue-800 text-brand-gold mb-1">
                    <Key size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Login Credentials</span>
                 </div>
                 
                 <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase">Login Email</label>
                    <div className="relative">
                      <input required type="email" className="w-full pl-10 pr-4 py-2.5 bg-brand-surface border border-gray-700 rounded-xl outline-none focus:border-brand-gold text-sm" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase">
                       {editingUser ? 'Reset Password' : 'Password'}
                    </label>
                    <div className="relative">
                      <input 
                        type="password" 
                        placeholder={editingUser ? "Enter new password to reset" : "Set password"} 
                        className="w-full pl-10 pr-4 py-2.5 bg-brand-surface border border-gray-700 rounded-xl outline-none focus:border-brand-gold text-sm" 
                        value={formData.password} 
                        onChange={e => setFormData({...formData, password: e.target.value})} 
                      />
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    {editingUser && <p className="text-[10px] text-gray-400 mt-1 ml-1">Leave blank to keep current password</p>}
                 </div>
               </div>

               <div className="flex items-center gap-3 pt-2">
                  <button type="button" onClick={() => setFormData({...formData, isActive: !formData.isActive})} className={`w-12 h-6 rounded-full transition-colors relative ${formData.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${formData.isActive ? 'left-7' : 'left-1'}`}></div>
                  </button>
                  <span className={`text-sm font-medium ${formData.isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formData.isActive ? 'Account Active' : 'Account Banned'}
                  </span>
               </div>

               <div className="pt-4">
                 <button type="submit" className="w-full py-3.5 bg-brand-gold text-white rounded-xl font-bold shadow-lg hover:bg-brand-gold-dark transition-colors flex items-center justify-center gap-2">
                   {editingUser ? <RefreshCcw size={18} /> : <UserPlus size={18} />}
                   {editingUser ? 'Update Credentials' : 'Create Account'}
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
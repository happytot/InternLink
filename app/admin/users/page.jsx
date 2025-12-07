'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import styles from './Users.module.css';
import { toast } from 'sonner';
import { FiSearch, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
// Import the Server Action
import { deleteUserAsAdmin } from './actions'; 

export default function UserManagement() {
  const supabase = createClientComponentClient();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // --- Modal State ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. Fetch Users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // 2. Trigger Confirmation Modal
  const confirmDelete = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  // 3. Close Modal
  const closeModal = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  // 4. Actual Delete Function (Calls Server Action)
  const executeDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);

    try {
      // Call the Server Action we created
      const result = await deleteUserAsAdmin(userToDelete.id);

      if (!result.success) {
        throw new Error(result.error);
      }
      
      toast.success("User deleted successfully");
      
      // Update UI immediately (Optimistic update)
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      closeModal();

    } catch (err) {
      console.error(err);
      toast.error("Failed to delete user", { 
        description: "Usually implies you lack Admin permissions or foreign key constraints." 
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter Logic (Same as before)
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' ? true : user.user_type === filterType;
    return matchesSearch && matchesType;
  });

  const getBadgeClass = (type) => {
    if (type === 'admin') return styles.roleAdmin;
    if (type === 'student') return styles.roleStudent;
    return styles.roleCompany;
  };

  return (
    <div className={styles.container}>
      {/* Header & Controls (Same as before) */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>User Management</h1>
          <p className={styles.subtitle}>View and manage all registered accounts.</p>
        </div>
        <div className={styles.controls}>
          <div className={styles.searchWrapper}>
            <FiSearch className={styles.searchIcon} />
            <input 
              type="text" placeholder="Search users..." className={styles.searchInput}
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className={styles.filterSelect}
            value={filterType} onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="admin">Admins</option>
            <option value="company">Companies</option> 
          </select>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.loading}>Loading users...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr><th>User</th><th>Role</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr><td colSpan="4" style={{textAlign:'center', padding:'40px', color:'var(--text-muted)'}}>No users found.</td></tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className={styles.userCell}>
                        <div className={styles.userAvatar}>{user.fullname ? user.fullname.charAt(0).toUpperCase() : '?'}</div>
                        <div>
                          <div style={{fontWeight:'600'}}>{user.fullname || 'Unnamed User'}</div>
                          <div style={{fontSize:'12px', color:'var(--text-muted)'}}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={`${styles.badge} ${getBadgeClass(user.user_type)}`}>{user.user_type || 'User'}</span></td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className={styles.actions}>
                        <button 
                          className={`${styles.btnIcon} ${styles.btnDelete}`}
                          onClick={() => confirmDelete(user)} // 👈 Opens Modal
                          title="Delete User"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

{/* --- CUSTOM CONFIRMATION MODAL --- */}
      {showDeleteModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            
            <h3 className={styles.modalTitle}>Delete Account?</h3>
            
            <p className={styles.modalText}>
              Are you sure you want to delete <strong>{userToDelete?.fullname || 'this user'}</strong>? 
              <br/>This action cannot be undone.
            </p>

            <div className={styles.modalActions}>
              <button className={styles.btnCancel} onClick={closeModal} disabled={isDeleting}>
                Cancel
              </button>
              <button className={styles.btnConfirm} onClick={executeDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
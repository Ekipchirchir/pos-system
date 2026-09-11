'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { getUsers, createUser, updateUser, deleteUser } from '@/services/api';
import { User } from '@/types';
import { HiUsers, HiPlus, HiMagnifyingGlass, HiPencilSquare, HiTrash, HiXMark } from 'react-icons/hi2';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'manager' | 'cashier'>('cashier');

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users', err);
    }
  };

    useEffect(() => {
        let isMounted = true;
        
        async function loadUsers() {
        try {
            const data = await getUsers();
            if (isMounted) {
            setUsers(data);
            }
        } catch (err) {
            if (isMounted) {
            console.error('Failed to load users', err);
            }
        }
        }

        loadUsers();

        return () => {
        isMounted = false;
        };
    }, []);

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const payload: { username?: string; role?: 'manager' | 'cashier'; password?: string } = { username, role };
        if (password) payload.password = password;
        await updateUser(editingUser.id, payload);
      } else {
        await createUser({ username, password, role });
      }
      closeDrawer();
      await fetchUsers();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Operation failed';
      alert(errorMessage);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteUser(id);
      await fetchUsers();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user';
      alert(errorMessage);
    }
  };

  const openEditDrawer = (user: User) => {
    setEditingUser(user);
    setUsername(user.username);
    setPassword('');
    setRole(user.role);
    setIsDrawerOpen(true);
  };

  const openAddDrawer = () => {
    setEditingUser(null);
    setUsername('');
    setPassword('');
    setRole('cashier');
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingUser(null);
    setUsername('');
    setPassword('');
    setRole('cashier');
  };

  const filteredUsers = users.filter((u) => u.username.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar />
      <main 
        className={`flex-1 flex flex-col ml-64 h-full p-8 overflow-hidden transition-all duration-300 ease-in-out ${
          isDrawerOpen ? 'mr-112' : 'mr-0'
        }`}
      >
        <div className="shrink-0">
          <header className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
              <p className="text-sm text-slate-400">Manage system users, access roles, and permissions.</p>
            </div>
            <button
              onClick={openAddDrawer}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-md"
            >
              <HiPlus className="text-lg" /> Add New User
            </button>
          </header>

          <div className="relative mb-6">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
              <HiMagnifyingGlass className="text-lg" />
            </span>
            <input
              type="text"
              placeholder="Search users by username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-600 font-medium"
            />
          </div>
        </div>

        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-y-auto shadow-sm">
          <div className="grid grid-cols-1 divide-y divide-slate-800">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <HiUsers className="text-4xl mx-auto mb-2 opacity-30" />
                No system users found
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-800/40 transition-colors">
                  <div className="space-y-1">
                    <div className="font-medium text-white text-base">{user.username}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>ID: <strong className="text-slate-300">#{user.id}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                        user.role === 'manager' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {user.role}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditDrawer(user)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
                      >
                        <HiPencilSquare className="text-sm" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-medium transition-colors"
                      >
                        <HiTrash className="text-sm" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-slate-900 border-l border-slate-800 z-40 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">
            {editingUser ? 'Edit User' : 'Add New User'}
          </h2>
          <button
            onClick={closeDrawer}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <HiXMark className="text-xl" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSaveUser} id="user-form" className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g., johndoe"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">
                Password {editingUser && '(Leave blank to keep current)'}
              </label>
              <input
                type="password"
                {...(!editingUser ? { required: true } : {})}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">User Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'manager' | 'cashier')}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-600"
              >
                <option value="cashier">Cashier</option>
                <option value="manager">Manager</option>
              </select>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900 flex gap-3">
          <button
            type="button"
            onClick={closeDrawer}
            className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="user-form"
            className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-sm transition-colors shadow-md"
          >
            {editingUser ? 'Save Changes' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  );
}
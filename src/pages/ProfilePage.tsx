import React, { useState } from 'react';
import {
  User,
  MapPin,
  Phone,
  Mail,
  Shield,
  Plus,
  Trash2,
  CheckCircle,
  LogOut,
  Upload,
  Camera,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Address } from '../types';

interface ProfilePageProps {
  onNavigate: (route: string, params?: Record<string, any>) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { currentUser, userProfile, updateProfile, signOut, signInWithGoogle, isAdmin } = useAuth();

  const [displayName, setDisplayName] = useState(userProfile?.displayName || currentUser?.displayName || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [photoURL, setPhotoURL] = useState(userProfile?.photoURL || currentUser?.photoURL || '');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: 'addr-user-1',
      userId: currentUser?.uid || 'guest',
      name: currentUser?.displayName || 'Saurav Kumar',
      phone: '9876543210',
      pincode: '560001',
      locality: 'Indiranagar 100ft Road',
      addressLine: 'Flat 402, Prestige Tower, 12th Main',
      city: 'Bengaluru',
      state: 'Karnataka',
      type: 'home',
      isDefault: true,
    },
  ]);

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddr, setNewAddr] = useState<Partial<Address>>({
    name: currentUser?.displayName || '',
    phone: '',
    pincode: '',
    locality: '',
    addressLine: '',
    city: '',
    state: '',
    type: 'home',
  });

  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <User className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Sign in to access your profile</h2>
        <p className="text-xs text-slate-500 mt-2">
          Manage your personal details, profile picture, delivery addresses, and preferences.
        </p>
        <button
          onClick={signInWithGoogle}
          className="mt-6 bg-indigo-600 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md"
        >
          Sign In with Google
        </button>
      </div>
    );
  }

  // Handle uploading photo from local file
  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPhotoURL(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    try {
      await updateProfile({ displayName, phone, photoURL });
      setSuccessMsg('Profile and photo updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      setErrorMsg('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddr.name || !newAddr.phone || !newAddr.pincode || !newAddr.addressLine) {
      setErrorMsg('Please fill all required address fields.');
      return;
    }
    const addr: Address = {
      id: `addr-${Date.now()}`,
      userId: currentUser.uid,
      name: newAddr.name,
      phone: newAddr.phone,
      pincode: newAddr.pincode,
      locality: newAddr.locality || '',
      addressLine: newAddr.addressLine,
      city: newAddr.city || 'Bengaluru',
      state: newAddr.state || 'Karnataka',
      type: newAddr.type || 'home',
      isDefault: addresses.length === 0,
    };
    setAddresses([...addresses, addr]);
    setShowAddressForm(false);
  };

  const handleDeleteAddress = (id: string) => {
    setAddresses(addresses.filter((a) => a.id !== id));
  };

  const myCustomerId = userProfile?.customerId || `CUST-${currentUser.uid.slice(-6).toUpperCase()}`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Profile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div className="flex items-center gap-4">
          <div className="relative group">
            {photoURL ? (
              <img
                src={photoURL}
                alt={displayName || 'User'}
                className="w-18 h-18 rounded-2xl object-cover ring-4 ring-indigo-500/20 shadow-md"
              />
            ) : (
              <div className="w-18 h-18 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-md">
                {displayName ? displayName[0] : 'U'}
              </div>
            )}
            <label className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full shadow-md border border-slate-200 text-slate-600 hover:text-indigo-600 cursor-pointer">
              <Camera className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                {displayName || 'TrendPro Member'}
              </h1>
              {isAdmin && (
                <span className="text-[11px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-md">
                  Administrator
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{currentUser.email}</p>
            <p className="text-[11px] text-indigo-700 font-mono mt-1 font-bold">
              Unique Customer ID: {myCustomerId}
            </p>
          </div>
        </div>

        <button
          onClick={signOut}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Profile Info Form with Photo from File (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" />
            Personal Profile & Avatar
          </h2>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={currentUser.email || ''}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-slate-500 cursor-not-allowed font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-hidden focus:border-indigo-500"
              />
            </div>

            {/* Profile image from file */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Upload Profile Picture from File
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoFileUpload}
                className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
              />
            </div>

            {successMsg && (
              <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> {successMsg}
              </p>
            )}

            {errorMsg && (
              <p className="text-xs text-rose-600 font-bold flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Saved Addresses (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-600" />
              Saved Delivery Addresses ({addresses.length})
            </h2>
            <button
              onClick={() => setShowAddressForm(true)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Address
            </button>
          </div>

          <div className="space-y-3">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-extrabold text-slate-900">{addr.name}</span>
                    <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                      {addr.type}
                    </span>
                    {addr.isDefault && (
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    {addr.addressLine}, {addr.locality}, {addr.city}, {addr.state} -{' '}
                    <strong>{addr.pincode}</strong>
                  </p>
                  <p className="text-slate-500 mt-1 font-mono">Mobile: {addr.phone}</p>
                </div>

                <button
                  onClick={() => handleDeleteAddress(addr.id)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                  title="Delete address"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Address Form Modal */}
          {showAddressForm && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Add Delivery Address</h3>
                <form onSubmit={handleAddAddress} className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newAddr.name}
                      onChange={(e) => setNewAddr({ ...newAddr, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-hidden"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Phone</label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={newAddr.phone}
                        onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">PIN Code</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={newAddr.pincode}
                        onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-hidden"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Address Line</label>
                    <input
                      type="text"
                      required
                      value={newAddr.addressLine}
                      onChange={(e) => setNewAddr({ ...newAddr, addressLine: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-hidden"
                    />
                  </div>
                  <div className="flex gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      className="flex-1 py-2 font-bold text-slate-600 bg-slate-100 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                    >
                      Save Address
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, Building2, Mail, Lock, Briefcase, Loader2, ArrowLeft, Camera, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { compressImageFile, savePropertyPhoto } from '../components/PropertyPhotoWidget';

const BUSINESS_TYPES = [
  'Restaurant / Cloud Kitchen / Darshini',
  'Supermarket / Kirana Hypermarket',
  'Hotel & Wedding Banquet Kitchen',
  'Corporate IT Park Cafeteria',
  'Bakery & Mithai Shop',
  'Institutional / Event Catering'
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    businessType: BUSINESS_TYPES[0]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoLoading, setPhotoLoading] = useState(false);
  const photoInputRef = useRef(null);

  const handlePhotoSelect = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setPhotoLoading(true);
    setError('');
    try {
      const compressed = await compressImageFile(file);
      setPhotoPreview(compressed);
    } catch (err) {
      setError(err.message || 'Unable to process the selected property photo.');
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(form);
      if (photoPreview) {
        savePropertyPhoto(null, photoPreview);
      }
      navigate('/dashboard');
    } catch (err) {
      const details = err.response?.data?.details;
      if (details && details.length > 0) {
        setError(details.map((d) => d.message).join(' • '));
      } else {
        setError(err.response?.data?.error || 'Registration failed. Please verify your inputs.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative">
      <Link
        to="/"
        className="absolute top-6 left-6 inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Overview
      </Link>

      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 mb-1">
            <Leaf className="w-7 h-7 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Register Your Organization</h1>
          <p className="text-sm text-slate-400">Start tracking food waste, carbon savings, and AI demand forecasts</p>
        </div>

        <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Establishment / Organization Name
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Annapurna Grand Kitchen, Bengaluru"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Operation Type
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <select
                  value={form.businessType}
                  onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  {BUSINESS_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="ops@annapurnakitchen.in"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password (min 6 characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Property / Establishment Photo <span className="text-slate-500">(Optional)</span>
              </label>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#47777B]/[0.12] border border-[#47777B]/30 flex items-center justify-center flex-shrink-0">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Property preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="w-5 h-5 text-[#47777B]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-200 truncate">
                    {photoPreview ? 'Property photo ready' : 'Upload storefront or kitchen photo'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    JPG, PNG, or WebP • Shown on your dashboard & header
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={photoLoading}
                    className="px-3 py-1.5 rounded-lg bg-[#47777B] hover:bg-[#355D61] text-[#FFFDF9] text-xs font-semibold transition-colors disabled:opacity-60"
                  >
                    {photoLoading ? 'Loading...' : photoPreview ? 'Change' : 'Upload'}
                  </button>
                  {photoPreview && (
                    <button
                      type="button"
                      onClick={() => setPhotoPreview('')}
                      className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
                      title="Remove photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="eco-btn-primary w-full py-3">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Workspace...</span>
                </>
              ) : (
                <span>Create Organization Account</span>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400">
            Already registered?{' '}
            <Link to="/login" className="text-emerald-400 font-semibold hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

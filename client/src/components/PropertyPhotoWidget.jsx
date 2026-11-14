import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Building2,
  Upload,
  Trash2,
  Link as LinkIcon,
  ChevronDown,
  Loader2
} from 'lucide-react';

const DEFAULT_KEY = 'ecopulse_property_photo_default';
const PHOTO_EVENT = 'ecopulse-property-photo-updated';

function getStorageKey(user) {
  const identifier = user?.id || user?.email;
  return identifier ? `ecopulse_property_photo_${identifier}` : DEFAULT_KEY;
}

export function getPropertyPhoto(user) {
  try {
    const key = getStorageKey(user);
    return localStorage.getItem(key) || localStorage.getItem(DEFAULT_KEY) || '';
  } catch {
    return '';
  }
}

export function savePropertyPhoto(user, dataUrl) {
  if (!dataUrl) return;
  try {
    localStorage.setItem(getStorageKey(user), dataUrl);
    if (!user?.id && !user?.email) {
      localStorage.setItem(DEFAULT_KEY, dataUrl);
    }
    window.dispatchEvent(new CustomEvent(PHOTO_EVENT, { detail: { photo: dataUrl } }));
  } catch (err) {
    console.error('Failed to save property photo:', err);
  }
}

export function removePropertyPhoto(user) {
  try {
    localStorage.removeItem(getStorageKey(user));
    localStorage.removeItem(DEFAULT_KEY);
    window.dispatchEvent(new CustomEvent(PHOTO_EVENT, { detail: { photo: '' } }));
  } catch {
    // Ignore storage removal errors
  }
}

export function compressImageFile(file, maxDimension = 900, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Please select a valid image file (PNG, JPG, WebP).'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Unable to read the selected image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Selected file could not be decoded as an image.'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function PropertyPhotoWidget({ user = null, variant = 'navbar' }) {
  const [photo, setPhoto] = useState(() => getPropertyPhoto(user));
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState('');
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setPhoto(getPropertyPhoto(user));
  }, [user]);

  useEffect(() => {
    const syncPhoto = () => {
      setPhoto(getPropertyPhoto(user));
    };
    window.addEventListener(PHOTO_EVENT, syncPhoto);
    window.addEventListener('storage', syncPhoto);
    return () => {
      window.removeEventListener(PHOTO_EVENT, syncPhoto);
      window.removeEventListener('storage', syncPhoto);
    };
  }, [user]);

  useEffect(() => {
    if (variant !== 'navbar') return;
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [variant]);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploading(true);
    setError('');
    try {
      const compressed = await compressImageFile(file);
      savePropertyPhoto(user, compressed);
      setPhoto(compressed);
    } catch (err) {
      setError(err.message || 'Could not process image.');
    } finally {
      setUploading(false);
    }
  };

  const handleApplyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (!/^https?:\/\/.+/i.test(trimmed)) {
      setError('Please enter a valid http:// or https:// image URL.');
      return;
    }
    setError('');
    savePropertyPhoto(user, trimmed);
    setPhoto(trimmed);
    setUrlInput('');
  };

  const handleRemove = (e) => {
    e?.stopPropagation();
    setError('');
    removePropertyPhoto(user);
    setPhoto('');
  };

  if (variant === 'banner') {
    return (
      <div className="relative flex-shrink-0">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          title={photo ? 'Click to change property photo' : 'Click to add property photo'}
          className="group relative w-[76px] h-[76px] sm:w-[88px] sm:h-[88px] rounded-2xl bg-[#FFFDF9] border-2 border-[#DED8C8] hover:border-[#47777B] shadow-sm overflow-hidden cursor-pointer transition-all flex items-center justify-center"
        >
          {photo ? (
            <>
              <img
                src={photo}
                alt={user?.name || 'Property'}
                onError={() => setError('Image failed to load.')}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-[#12231B]/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-[#FFFDF9] text-[10px] font-semibold px-1 text-center">
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Camera className="w-4 h-4 mb-0.5" />
                    <span>Change Photo</span>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center px-1.5 space-y-1">
              <div className="p-2 rounded-xl bg-[#47777B]/[0.12] text-[#47777B] group-hover:bg-[#47777B] group-hover:text-[#FFFDF9] transition-colors">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              </div>
              <span className="text-[10px] font-semibold text-[#355D61] leading-tight">
                Add Photo
              </span>
            </div>
          )}
        </div>

        {photo && (
          <button
            type="button"
            onClick={handleRemove}
            title="Remove property photo"
            className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-[#FFFDF9] border border-[#DED8C8] text-[#635C4E] hover:text-[#B93D1D] hover:border-[#F2CFC4] shadow-sm transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}

        {error && (
          <div className="mt-1 text-[10px] font-medium text-[#B93D1D] max-w-[140px]">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative hidden md:block" ref={containerRef}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1 rounded-xl bg-[#FFFDF9] border border-[#DED8C8] hover:border-[#47777B]/60 shadow-sm transition-all text-left"
        title="View or update property photo"
        aria-expanded={open}
      >
        <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#47777B]/[0.12] border border-[#47777B]/25 flex items-center justify-center flex-shrink-0">
          {photo ? (
            <img
              src={photo}
              alt={user?.name || 'Property'}
              className="w-full h-full object-cover"
            />
          ) : (
            <Building2 className="w-4 h-4 text-[#47777B]" />
          )}
        </div>

        <div className="text-xs leading-tight">
          <div className="font-semibold text-[#12231B] max-w-[150px] truncate">
            {user?.name || 'Establishment'}
          </div>
          <div className="text-[10px] font-medium text-[#635C4E] flex items-center gap-1 max-w-[150px] truncate">
            <Camera className="w-2.5 h-2.5 text-[#47777B] flex-shrink-0" />
            <span className="truncate">{photo ? 'Property Photo' : 'Add Photo'}</span>
          </div>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-[#635C4E] transition-transform duration-150 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#FFFDF9] border border-[#C7BFA9] shadow-xl p-4 z-50 space-y-3.5">
          <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[#ECE6D6]">
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#635C4E]">
                Establishment Profile
              </div>
              <div className="font-display text-sm font-semibold text-[#12231B] truncate mt-0.5">
                {user?.name || 'Your Property'}
              </div>
              {user?.businessType && (
                <div className="text-[11px] text-[#635C4E] truncate">{user.businessType}</div>
              )}
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#47777B]/[0.12] text-[#355D61] border border-[#47777B]/30 flex-shrink-0">
              Property Photo
            </span>
          </div>

          {photo ? (
            <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-[#DED8C8] bg-[#ECE6D6]">
              <img
                src={photo}
                alt={user?.name || 'Property preview'}
                onError={() => setError('Image URL could not be loaded.')}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-video rounded-xl border-2 border-dashed border-[#C7BFA9] hover:border-[#47777B] bg-[#F5F1E8]/70 hover:bg-[#47777B]/5 transition-all flex flex-col items-center justify-center gap-1.5 text-center p-4"
            >
              <div className="p-2.5 rounded-full bg-[#47777B]/[0.12] text-[#47777B]">
                <Camera className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-[#12231B]">Add Property Photo</span>
              <span className="text-[11px] text-[#635C4E]">
                Upload a photo of your kitchen, restaurant, or store
              </span>
            </button>
          )}

          {error && (
            <div className="text-[11px] text-[#B93D1D] bg-[#FDF4F1] border border-[#F2CFC4] rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#47777B] hover:bg-[#355D61] text-[#FFFDF9] px-3 py-2 text-xs font-semibold shadow-sm transition-all disabled:opacity-60"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>{photo ? 'Change Photo' : 'Upload Property Photo'}</span>
                </>
              )}
            </button>

            {photo && (
              <button
                type="button"
                onClick={handleRemove}
                className="inline-flex items-center justify-center gap-1 rounded-xl bg-[#FDF4F1] hover:bg-[#FAEAE4] text-[#B93D1D] border border-[#F2CFC4] px-3 py-2 text-xs font-semibold transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-[#ECE6D6] space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#635C4E]">
              Or paste photo URL
            </label>
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <LinkIcon className="w-3.5 h-3.5 text-[#827A69] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleApplyUrl();
                    }
                  }}
                  placeholder="https://example.com/kitchen.jpg"
                  className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-[#F5F1E8] border border-[#DED8C8] text-xs text-[#12231B] focus:outline-none focus:border-[#47777B]"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyUrl}
                className="px-2.5 py-1.5 rounded-lg bg-[#ECE6D6] hover:bg-[#DED8C8] text-xs font-semibold text-[#12231B] transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

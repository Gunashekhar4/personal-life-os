import React, { useState, useRef } from 'react';
import { Sparkles, Tag, Plus, Search, HelpCircle, File, FolderOpen, ExternalLink, Link, Trash2, ArrowUpCircle, RefreshCw } from 'lucide-react';
import { VaultItem, VaultCategory } from '../types';

interface VaultProps {
  items: VaultItem[];
  appsScriptUrl: string;
  onAddItem: (item: Omit<VaultItem, 'id' | 'dateAdded'>) => void;
  onDeleteItem: (id: string) => void;
}

export default function KnowledgeVaultView({ items, appsScriptUrl, onAddItem, onDeleteItem }: VaultProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<VaultCategory>('AI Tools');
  const [tagsInput, setTagsInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // File attachments state
  const [attachedFile, setAttachedFile] = useState<{ name: string; type: string; base64: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [search, setSearch] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      setAttachedFile({
        name: file.name,
        type: file.type,
        base64: base64String
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      setAttachedFile({
        name: file.name,
        type: file.type,
        base64: base64String
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let finalFileUrl = undefined;
    let finalDriveId = undefined;
    let finalFileType = undefined;

    // If there is an attachment and Google cloud sync is linked, upload file!
    if (attachedFile) {
      finalFileType = attachedFile.name.endsWith('.pdf') ? 'PDF' : 
                     attachedFile.name.match(/\.(jpg|jpeg|png|gif)$/i) ? 'Screenshot' : 'Document';
      
      if (appsScriptUrl) {
        setIsUploading(true);
        try {
          const res = await fetch(appsScriptUrl, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
              action: 'upload',
              file: {
                name: attachedFile.name,
                type: attachedFile.type,
                data: attachedFile.base64
              },
              category
            })
          });
          const data = await res.json();
          if (data.status === 'success') {
            finalFileUrl = data.fileUrl;
            finalDriveId = data.driveId;
          } else {
            console.error('File upload rejected by Google script', data.message);
            alert('Cloud file upload failed. Saved locally as text node backup.');
          }
        } catch (err) {
          console.error('Upload connection error', err);
          alert('Upload failed: Google cloud offline. Reference saved locally.');
        } finally {
          setIsUploading(false);
        }
      } else {
        // Mock save URL when entirely offline
        finalFileUrl = 'Local Sandbox Storage (Configure Cloud settings to backup files to your own Drive account)';
      }
    }

    const tagsArr = tagsInput.split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    onAddItem({
      title: title.trim(),
      description: description.trim(),
      category,
      tags: tagsArr,
      fileUrl: finalFileUrl,
      fileType: finalFileType || (description.startsWith('http') ? 'Link' : undefined),
      driveId: finalDriveId
    });

    // Reset Form
    setTitle('');
    setDescription('');
    setTagsInput('');
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Filter items
  const filteredVault = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                          item.description.toLowerCase().includes(search.toLowerCase()) ||
                          item.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = activeCategoryFilter === 'all' || item.category === activeCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div id="knowledge-vault-module" className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      
      {/* 1. Add Resource Column */}
      <div className="xl:col-span-4 space-y-6">
        <div className="bg-[#0c0c0e] rounded-xl border border-zinc-850 p-6 sticky top-6 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <h3 className="font-display font-semibold text-base text-zinc-150">Store Brain Asset</h3>
          </div>

          <form id="form-add-vault" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-3xs font-mono text-zinc-500 mb-1 font-bold">ASSET TITLE</label>
              <input
                id="vault-input-title"
                type="text"
                required
                placeholder="Dijkstra implementation notes DB..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs bg-[#09090b] border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-zinc-205 text-zinc-200 placeholder-zinc-700"
              />
            </div>

            <div>
              <label className="block text-3xs font-mono text-zinc-500 mb-1 font-bold">CONTENT, OVERVIEW OR URL LINK</label>
              <textarea
                id="vault-input-desc"
                rows={3}
                placeholder="Paste code blocks, notes description or website URL links..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs bg-[#09090b] border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-505 text-zinc-200 placeholder-zinc-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-3xs font-mono text-zinc-500 mb-1 font-bold">SECTOR</label>
                <select
                  id="vault-input-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as VaultCategory)}
                  className="w-full text-xs bg-[#09090b] border border-zinc-800 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-200 cursor-pointer"
                >
                  {['AI Tools', 'Programming', 'Career', 'Learning', 'Research', 'Projects', 'Personal'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-3xs font-mono text-zinc-500 mb-1 font-bold">TAGS (COMMA SEP)</label>
                <input
                  id="vault-input-tags"
                  type="text"
                  placeholder="dsa, java"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full text-xs bg-[#09090b] border border-zinc-800 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-202 text-zinc-200 placeholder-zinc-700"
                />
              </div>
            </div>

            {/* Drag & Drop File Selector area */}
            <div className="space-y-1.5">
              <label className="block text-3xs font-mono text-zinc-500 font-bold uppercase">
                DRIVE ATTACHMENT
              </label>
              
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-zinc-800 hover:border-zinc-700 rounded-lg p-3 text-center cursor-pointer bg-[#09090b]/30 hover:bg-[#09090b]/60 transition-all flex flex-col items-center justify-center gap-1"
              >
                <ArrowUpCircle className="h-4 w-4 text-indigo-400" />
                <p className="text-3xs font-mono text-zinc-300">
                  {attachedFile ? attachedFile.name : 'Drop file or click to browse'}
                </p>
                <span className="text-[9px] text-zinc-600 font-mono">Max size 4MB. direct upload to drive</span>
              </div>

              <input
                id="file-vault-selector"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,image/*,.doc,.docx"
              />
            </div>

            <button
              id="btn-vault-submit"
              type="submit"
              disabled={isUploading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer mt-1 shadow-md shadow-indigo-500/10"
            >
              {isUploading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Lock Into Second Brain
            </button>
          </form>
        </div>
      </div>

      {/* 2. Brain explorer list */}
      <div className="xl:col-span-8 space-y-4">
        
        {/* Sorting controls and search */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#0c0c0e] border border-zinc-850 p-4 rounded-xl shadow-sm">
          <h4 className="font-display font-semibold text-sm text-zinc-200">Your Second Brain Vault</h4>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-550" />
            <input
              type="text"
              placeholder="Search by keywords, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-[#09090b] border border-zinc-800 rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-zinc-550 text-zinc-200 placeholder-zinc-650"
            />
          </div>
        </div>

        {/* Categories filtration tabs */}
        <div className="flex flex-wrap gap-1.5">
          {['all', 'AI Tools', 'Programming', 'Career', 'Learning', 'Research', 'Projects', 'Personal'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategoryFilter(cat)}
              className={`px-2.5 py-1 text-3xs font-mono uppercase tracking-wider rounded border transition-all cursor-pointer ${
                activeCategoryFilter === cat
                  ? 'bg-indigo-600 text-white font-bold border-indigo-650 shadow-sm'
                  : 'bg-[#0c0c0e]/80 text-zinc-400 border-zinc-850 hover:bg-[#121217]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Resources Grid/Stacked views */}
        <div className="space-y-3">
           {filteredVault.length === 0 ? (
            <div className="bg-[#0c0c0e] border border-zinc-850 p-12 text-center rounded-xl flex flex-col items-center">
              <FolderOpen className="h-10 w-10 text-zinc-600 mb-3" />
              <p className="text-zinc-400 font-display font-medium text-xs">No assets match your query</p>
              <p className="text-zinc-500 text-3xs font-mono mt-1">Populate your second brain with references and URLs.</p>
            </div>
          ) : (
            filteredVault.map((item) => {
              const trimmedDesc = item.description?.trim() || '';
              const isUrl = trimmedDesc.startsWith('http') && !trimmedDesc.includes(' ') && !trimmedDesc.includes('\n');

              return (
                <div
                  key={item.id}
                  className="group bg-[#0c0c0e] rounded-xl border border-zinc-850 hover:border-zinc-800 p-4 transition-all flex flex-col sm:flex-row justify-between items-start gap-4 shadow-sm"
                >
                  
                  <div className="space-y-2.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 text-3xs">
                      <span className="px-2 py-0.5 font-mono uppercase tracking-wider text-teal-400 border border-teal-550/10 bg-teal-500/5 rounded">
                        {item.category}
                      </span>
                      
                      {item.fileType && (
                        <span className="px-2 py-0.5 font-mono uppercase tracking-wider text-pink-400 border border-pink-550/10 bg-pink-500/5 rounded">
                          {item.fileType}
                        </span>
                      )}

                      <span className="text-zinc-550 font-mono">
                        {item.dateAdded}
                      </span>
                    </div>

                    <h4 className="font-display font-semibold text-zinc-200 group-hover:text-indigo-400 transition-colors text-sm truncate">
                      {item.title}
                    </h4>

                    {item.description && (
                      <div className="text-xs text-zinc-300 font-sans leading-relaxed break-all bg-[#09090b]/40 p-3 rounded border border-zinc-850/80">
                        {isUrl ? (
                          <a href={trimmedDesc} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-indigo-455 hover:text-indigo-400 hover:underline font-mono">
                            <Link className="h-3 w-3 shrink-0" /> {trimmedDesc}
                          </a>
                        ) : (
                          <p className="whitespace-pre-wrap">{item.description}</p>
                        )}
                      </div>
                    )}

                    {/* Attachment metadata links */}
                    {item.fileUrl && (
                      <div className="flex items-center gap-2 bg-[#09090b] p-2 rounded border border-zinc-850 text-3xs font-mono text-zinc-400">
                        <File className="h-3 w-3 text-pink-400 shrink-0" />
                        <span className="truncate flex-1">DRIVE REF ID: {item.driveId || 'Stored'}</span>
                        
                        {item.fileUrl.startsWith('http') && (
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-455 hover:text-indigo-400 hover:underline font-bold"
                          >
                            OPEN DRIVE <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Tag capsules */}
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.tags.map((tg) => (
                          <span key={tg} className="px-1.5 py-0.5 bg-[#09090b]/50 text-zinc-555 text-3xs font-mono rounded">
                            #{tg}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card deletion */}
                  <div className="self-end sm:self-start sm:border-l sm:border-zinc-850 sm:pl-3">
                    <button
                      id={`btn-delete-vault-item-${item.id}`}
                      onClick={() => {
                        if (window.confirm('Delete this Second Brain resource from metadata and local memory?')) {
                          onDeleteItem(item.id);
                        }
                      }}
                      className="h-8 w-8 text-zinc-650 hover:text-red-400 hover:bg-red-500/5 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                      title="Remove asset"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
}

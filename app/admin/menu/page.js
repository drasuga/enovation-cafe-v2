'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { supabase } from '@/lib/supabase';

const fmt = (n) => n.toLocaleString('fr-FR') + ' FCFA';

const EMPTY = {
  id: null,
  name: '',
  description: '',
  price: '',
  category_id: '',
  is_available: true,
  image_url: '',
};

function MenuAdmin() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [fileKey, setFileKey] = useState(0);
  const [newCat, setNewCat] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const [c, i] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('menu_items').select('*').order('name'),
    ]);
    setCategories(c.data || []);
    setItems(i.data || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function resetForm() {
    setForm(EMPTY);
    setFile(null);
    setFileKey((k) => k + 1);
  }

  async function addCategory(e) {
    e.preventDefault();
    if (!newCat.trim()) return;
    await supabase
      .from('categories')
      .insert({ name: newCat.trim(), sort_order: categories.length + 1 });
    setNewCat('');
    load();
  }

  async function deleteCategory(cat) {
    if (!confirm(`Supprimer la catégorie "${cat.name}" ? Ses articles n'apparaîtront plus dans le menu tant qu'ils n'auront pas de catégorie.`)) return;
    await supabase.from('categories').delete().eq('id', cat.id);
    load();
  }

  async function saveItem(e) {
    e.preventDefault();
    setError('');

    const price = Number.parseInt(form.price, 10);
    if (!form.name.trim() || !Number.isInteger(price) || price < 0) {
      setError('Un nom et un prix valides sont requis.');
      return;
    }
    if (file && file.size > 3 * 1024 * 1024) {
      setError('Image trop lourde (max 3 Mo).');
      return;
    }

    setSaving(true);
    try {
      let image_url = form.image_url || null;

      if (file) {
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
        const path = `${crypto.randomUUID()}.${ext || 'jpg'}`;
        const { error: upErr } = await supabase.storage
          .from('menu-images')
          .upload(path, file, { contentType: file.type });
        if (upErr) throw upErr;
        image_url = supabase.storage.from('menu-images').getPublicUrl(path).data.publicUrl;
      }

      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price,
        category_id: form.category_id || null,
        is_available: form.is_available,
        image_url,
      };

      const query = form.id
        ? supabase.from('menu_items').update(payload).eq('id', form.id)
        : supabase.from('menu_items').insert(payload);

      const { error: dbErr } = await query;
      if (dbErr) throw dbErr;

      resetForm();
      await load();
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.');
    }
    setSaving(false);
  }

  function editItem(item) {
    setForm({
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: String(item.price),
      category_id: item.category_id || '',
      is_available: item.is_available,
      image_url: item.image_url || '',
    });
    setFile(null);
    setFileKey((k) => k + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function toggleAvailable(item) {
    await supabase.from('menu_items').update({ is_available: !item.is_available }).eq('id', item.id);
    load();
  }

  async function deleteItem(item) {
    if (!confirm(`Supprimer "${item.name}" ?`)) return;
    await supabase.from('menu_items').delete().eq('id', item.id);
    load();
  }

  return (
    <>
      <h2 className="category-title" style={{ marginTop: 0 }}>
        {form.id ? 'Modifier un article' : 'Ajouter un article'}
      </h2>

      <form onSubmit={saveItem} className="card">
        <label className="field">
          <span>Nom *</span>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="field">
          <span>Description</span>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>
        <label className="field">
          <span>Prix (FCFA) *</span>
          <input
            inputMode="numeric"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
        </label>
        <label className="field">
          <span>Catégorie</span>
          <select
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
          >
            <option value="">— Aucune —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Photo (max 3 Mo)</span>
          <input
            key={fileKey}
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>
        {form.image_url && !file && (
          <img className="thumb" src={form.image_url} alt="" style={{ marginTop: 10 }} />
        )}
        <label className="check">
          <input
            type="checkbox"
            checked={form.is_available}
            onChange={(e) => setForm({ ...form, is_available: e.target.checked })}
          />
          Disponible
        </label>

        {error && <p className="error">{error}</p>}

        <button className="primary-btn" type="submit" disabled={saving}>
          {saving ? 'Enregistrement...' : form.id ? 'Mettre à jour' : 'Ajouter'}
        </button>
        {form.id && (
          <button
            type="button"
            className="primary-btn"
            style={{ background: 'transparent', color: 'var(--brand-dark)', marginTop: 8 }}
            onClick={resetForm}
          >
            Annuler la modification
          </button>
        )}
      </form>

      <h2 className="category-title">Catégories</h2>
      <div className="card">
        {categories.map((c) => (
          <div className="line" key={c.id}>
            <span>{c.name}</span>
            <button className="btn btn-ghost" onClick={() => deleteCategory(c)}>
              Supprimer
            </button>
          </div>
        ))}
        <form onSubmit={addCategory} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <input
            className="inline-input"
            placeholder="Nouvelle catégorie"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
          />
          <button className="btn" type="submit">
            Ajouter
          </button>
        </form>
      </div>

      <h2 className="category-title">Articles ({items.length})</h2>
      {items.map((item) => (
        <div className="item" key={item.id} style={{ opacity: item.is_available ? 1 : 0.55 }}>
          <div className="item-main">
            {item.image_url && <img className="thumb" src={item.image_url} alt={item.name} />}
            <div>
              <h3>{item.name}</h3>
              <p>
                {categories.find((c) => c.id === item.category_id)?.name || 'Sans catégorie'} ·{' '}
                {fmt(item.price)}
                {!item.is_available && ' · Indisponible'}
              </p>
            </div>
          </div>
          <div className="item-actions">
            <button className="btn" onClick={() => editItem(item)}>
              Modifier
            </button>
            <button className="btn btn-ghost" onClick={() => toggleAvailable(item)}>
              {item.is_available ? 'Masquer' : 'Afficher'}
            </button>
            <button className="btn btn-ghost" onClick={() => deleteItem(item)}>
              ✕
            </button>
          </div>
        </div>
      ))}
    </>
  );
}

export default function AdminMenuPage() {
  return (
    <AdminShell>
      <MenuAdmin />
    </AdminShell>
  );
}
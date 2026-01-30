
import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Database,
  Layers,
  Weight,
  Lock,
  Bell,
  Plus,
  MoreVertical,
  Trash2,
  Edit2
} from 'lucide-react';

import { supabase } from '../supabase';

const Settings: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      setLoading(true);
      const { data: catData } = await supabase.from('categories').select('*').order('name');
      const { data: unitData } = await supabase.from('units').select('*').order('name');
      setCategories(catData || []);
      setUnits(unitData || []);
    } catch (error) {
      console.error('Error fetching metadata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    const name = prompt('Enter new category name:');
    if (!name) return;
    try {
      const { error } = await supabase.from('categories').insert([{ name }]);
      if (error) throw error;
      fetchMetadata();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleAddUnit = async () => {
    const name = prompt('Enter new unit name (e.g., Kg, Ut, Pkt):');
    if (!name) return;
    try {
      const { error } = await supabase.from('units').insert([{ name }]);
      if (error) throw error;
      fetchMetadata();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      await supabase.from('categories').delete().eq('id', id);
      fetchMetadata();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeleteUnit = async (id: string) => {
    if (!confirm('Delete this unit?')) return;
    try {
      await supabase.from('units').delete().eq('id', id);
      fetchMetadata();
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">System Settings</h1>
        <p className="text-slate-500">Configure global parameters and metadata for EzLaunch</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm text-left">
            <Layers size={18} />
            Data Masters
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-sm text-left transition-colors">
            <Lock size={18} />
            Users & Roles
          </button>
        </div>

        <div className="md:col-span-3 space-y-8">
          {/* Categories Management */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-slate-800">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                  <Layers size={20} />
                </div>
                <h3 className="text-lg font-bold">Manage Categories</h3>
              </div>
              <button
                onClick={handleAddCategory}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
              >
                <Plus size={14} /> Add Category
              </button>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                  <span className="text-sm font-semibold">{cat.name}</span>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Units Management */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-slate-800">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <Weight size={20} />
                </div>
                <h3 className="text-lg font-bold">Measurement Units</h3>
              </div>
              <button
                onClick={handleAddUnit}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
              >
                <Plus size={14} /> Add Unit
              </button>
            </div>
            <div className="p-4 flex flex-wrap gap-2">
              {units.map((unit) => (
                <span key={unit.id} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-full text-sm font-bold text-slate-600 hover:border-blue-200 hover:bg-blue-50 transition-colors group">
                  {unit.name}
                  <button
                    onClick={() => handleDeleteUnit(unit.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
                  >
                    <Plus size={14} className="rotate-45" />
                  </button>
                </span>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Settings;

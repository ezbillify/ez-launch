
import React, { useState, useEffect } from 'react';
import {
  Plus,
  Upload,
  Download,
  Filter,
  Search,
  Edit2,
  Trash2,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  FileText,
  AlertCircle
} from 'lucide-react';
import { ProductMaster } from '../types';

import { supabase } from '../supabase';

const Products: React.FC = () => {
  const [products, setProducts] = useState<ProductMaster[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [unitList, setUnitList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductMaster | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Form state
  const [formData, setFormData] = useState({
    item_name: '',
    barcode: '',
    category: '',
    hsn_code: '',
    unit: '',
    mrp: 0,
    tax_rate: 0
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        item_name: editingProduct.item_name || '',
        barcode: editingProduct.barcode || '',
        category: editingProduct.category || '',
        hsn_code: editingProduct.hsn_code || '',
        unit: editingProduct.unit || '',
        mrp: editingProduct.mrp || 0,
        tax_rate: editingProduct.tax_rate || 0
      });
    } else {
      setFormData({ item_name: '', barcode: '', category: '', hsn_code: '', unit: '', mrp: 0, tax_rate: 0 });
    }
  }, [editingProduct]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const { data: pData } = await supabase.from('product_master').select('*').order('created_at', { ascending: false });
      setProducts(pData || []);

      const { data: cData } = await supabase.from('categories').select('name');
      setCategories(['All', ...(cData?.map(c => c.name) || [])]);

      const { data: uData } = await supabase.from('units').select('name');
      setUnitList(uData?.map(u => u.name) || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        const { error } = await supabase.from('product_master').update(formData).eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('product_master').insert([formData]);
        if (error) throw error;
      }
      setShowAddModal(false);
      setEditingProduct(null);
      fetchInitialData();
    } catch (error: any) { alert(error.message); }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await supabase.from('product_master').delete().eq('id', id);
      setProducts(products.filter(p => p.id !== id));
    } catch (e) { alert(e); }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim() !== '');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

      const newItems = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const obj: any = {};
        headers.forEach((h, i) => {
          if (h === 'barcode') obj.barcode = values[i];
          if (h === 'item_name' || h === 'name') obj.item_name = values[i];
          if (h === 'category') obj.category = values[i];
          if (h === 'hsn_code' || h === 'hsn') obj.hsn_code = values[i];
          if (h === 'unit') obj.unit = values[i];
          if (h === 'mrp') obj.mrp = Number(values[i]);
          if (h === 'tax_rate' || h === 'tax' || h === 'gst') obj.tax_rate = Number(values[i]);
        });
        return obj;
      }).filter(item => item.barcode && item.item_name);

      if (newItems.length > 0) {
        const { error } = await supabase.from('product_master').upsert(newItems, { onConflict: 'barcode' });
        if (error) alert(error.message);
        else {
          alert(`Successfully uploaded ${newItems.length} products`);
          fetchInitialData();
          setShowBulkUpload(false);
        }
      }
    };
    reader.readAsText(file);
  };

  const filteredProducts = products.filter(p =>
    (selectedCategory === 'All' || p.category === selectedCategory) &&
    ((p.item_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.barcode || '').includes(searchTerm))
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Product Master</h1>
          <p className="text-slate-500">Manage your central product inventory database</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowBulkUpload(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200">
            <Upload size={18} /> Bulk Upload
          </button>
          <button onClick={() => { setEditingProduct(null); setShowAddModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
            <Plus size={18} /> Add Product
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Search by name or barcode..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="relative">
          <select className="appearance-none pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-medium" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Product Details</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Unit</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">HSN Code</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">MRP</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Tax %</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Barcode</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-semibold text-slate-800">{p.item_name}</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">{p.category || 'Other'}</span></td>
                  <td className="px-6 py-4 text-sm font-bold">{p.unit || '-'}</td>
                  <td className="px-6 py-4 text-sm">{p.hsn_code || '-'}</td>
                  <td className="px-6 py-4 text-sm font-bold">₹{p.mrp}</td>
                  <td className="px-6 py-4 text-sm font-bold">{p.tax_rate}%</td>
                  <td className="px-6 py-4"><code className="text-xs bg-slate-50 px-2 py-1 rounded font-mono">{p.barcode}</code></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setEditingProduct(p); setShowAddModal(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                      <button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => { setShowAddModal(false); setEditingProduct(null); }}></div>
          <form onSubmit={handleSubmit} className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between text-slate-800">
              <h2 className="text-xl font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button type="button" onClick={() => { setShowAddModal(false); setEditingProduct(null); }} className="p-2 text-slate-400 hover:text-slate-600"><Plus className="rotate-45" size={24} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Item Name</label>
                <input required type="text" value={formData.item_name} onChange={(e) => setFormData({ ...formData, item_name: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Barcode</label>
                  <input required type="text" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">MRP (₹)</label>
                  <input required type="number" value={formData.mrp} onChange={(e) => setFormData({ ...formData, mrp: Number(e.target.value) })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Tax Rate (%)</label>
                  <input required type="number" value={formData.tax_rate} onChange={(e) => setFormData({ ...formData, tax_rate: Number(e.target.value) })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select Category</option>
                    {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Unit</label>
                  <select required value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select Unit</option>
                    {unitList.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">HSN Code</label>
                <input type="text" value={formData.hsn_code} onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button type="button" onClick={() => { setShowAddModal(false); setEditingProduct(null); }} className="px-6 py-2 text-slate-600 font-semibold hover:bg-slate-200 rounded-lg">Cancel</button>
              <button type="submit" className="px-8 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-lg shadow-blue-200">Save Changes</button>
            </div>
          </form>
        </div>
      )}

      {showBulkUpload && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowBulkUpload(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden p-8 text-center text-slate-800">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"><FileText size={32} /></div>
            <h2 className="text-xl font-bold mb-2">Bulk Product Upload</h2>
            <p className="text-slate-500 mb-6 text-sm">Upload a CSV file with headers: <br /><code className="bg-slate-100 px-2 py-1 rounded">barcode, item_name, category, unit, mrp, tax_rate, hsn_code</code></p>

            <div className="flex flex-col gap-4">
              <label className="block w-full cursor-pointer">
                <div className="px-6 py-10 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition-all">
                  <input type="file" className="hidden" accept=".csv" onChange={handleBulkUpload} />
                  <Upload className="mx-auto text-slate-400 mb-2" />
                  <span className="text-sm font-semibold text-slate-600">Click to select CSV file</span>
                </div>
              </label>

              <button
                onClick={() => {
                  const headers = 'barcode,item_name,category,unit,mrp,tax_rate,hsn_code\n';
                  const sample = '890123456789,Sample Product,Groceries,Unit,199,18,2106\n';
                  const blob = new Blob([headers + sample], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'ezlaunch_product_template.csv';
                  a.click();
                }}
                className="flex items-center justify-center gap-2 text-blue-600 font-bold text-sm hover:underline"
              >
                <Download size={16} />
                Download CSV Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;

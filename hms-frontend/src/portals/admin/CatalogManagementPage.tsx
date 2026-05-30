import React, { useState, useEffect } from 'react';
import { 
  ListOrdered, 
  Plus, 
  Search, 
  Edit2, 
  Archive, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  ChevronRight,
  Package,
  Layers,
  Loader2
} from 'lucide-react';
import { apiClient } from '../../lib/api';

interface Category {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

interface ServiceItem {
  id: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  categoryId: string;
  category?: Category;
  currentPrice?: number | null;
}

export const CatalogManagementPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'items' | 'categories'>('items');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState<'item' | 'category' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [itemForm, setItemForm] = useState({
    name: '',
    code: '',
    description: '',
    categoryId: '',
    isActive: true
  });
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    isActive: true
  });

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [catsRes, itemsRes] = await Promise.all([
        apiClient.get('/catalog/categories?includeInactive=true'),
        apiClient.get('/catalog/items?includeInactive=true')
      ]);
      setCategories(catsRes.data);
      setItems(itemsRes.data);
    } catch (error) {
      console.error('Failed to fetch catalog data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiClient.patch(`/catalog/items/${editingId}`, itemForm);
      } else {
        await apiClient.post('/catalog/items', itemForm);
      }
      setShowModal(null);
      setEditingId(null);
      fetchData();
    } catch (error) {
      console.error('Failed to save item:', error);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiClient.patch(`/catalog/categories/${editingId}`, categoryForm);
      } else {
        await apiClient.post('/catalog/categories', categoryForm);
      }
      setShowModal(null);
      setEditingId(null);
      fetchData();
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  };

  const openItemModal = (item?: ServiceItem) => {
    if (item) {
      setEditingId(item.id);
      setItemForm({
        name: item.name,
        code: item.code,
        description: item.description || '',
        categoryId: item.categoryId,
        isActive: item.isActive
      });
    } else {
      setEditingId(null);
      setItemForm({
        name: '',
        code: '',
        description: '',
        categoryId: categories[0]?.id || '',
        isActive: true
      });
    }
    setShowModal('item');
  };

  const openCategoryModal = (cat?: Category) => {
    if (cat) {
      setEditingId(cat.id);
      setCategoryForm({
        name: cat.name,
        description: cat.description || '',
        isActive: cat.isActive
      });
    } else {
      setEditingId(null);
      setCategoryForm({
        name: '',
        description: '',
        isActive: true
      });
    }
    setShowModal('category');
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <ListOrdered className="h-6 w-6 text-indigo-600" />
            Catalog Management
          </h1>
          <p className="text-sm text-slate-500 font-medium">Manage services, products, and pricing across your facility.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => openCategoryModal()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Category
          </button>
          <button 
            onClick={() => openItemModal()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
          >
            <Plus className="h-4 w-4" />
            New Item
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-2 border border-slate-200 rounded-2xl shadow-sm">
        <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('items')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 flex-1 sm:flex-none justify-center ${
              activeTab === 'items' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Package className="h-4 w-4" />
            Items & Services
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 flex-1 sm:flex-none justify-center ${
              activeTab === 'categories' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Layers className="h-4 w-4" />
            Categories
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Loading Catalog...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  {activeTab === 'items' ? (
                    <>
                      <th className="px-6 py-4 text-table-header">Code / Item</th>
                      <th className="px-6 py-4 text-table-header">Category</th>
                      <th className="px-6 py-4 text-table-header">Price</th>
                      <th className="px-6 py-4 text-table-header">Status</th>
                      <th className="px-6 py-4 text-table-header text-right">Actions</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-4 text-table-header">Category Name</th>
                      <th className="px-6 py-4 text-table-header">Description</th>
                      <th className="px-6 py-4 text-table-header">Status</th>
                      <th className="px-6 py-4 text-table-header text-right">Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeTab === 'items' ? (
                  filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-xs">
                              {item.code.substring(0, 2)}
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-800 tracking-tight">{item.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{item.code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                            {item.category?.name || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-sm text-slate-600">
                          {item.currentPrice ? (
                            <span className="text-indigo-600 font-black">₱{Number(item.currentPrice).toLocaleString()}</span>
                          ) : (
                            <span className="text-slate-300 italic">Not set</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {item.isActive ? (
                            <span className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                              <CheckCircle2 className="h-3 w-3" />
                              Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                              <XCircle className="h-3 w-3" />
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => openItemModal(item)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                              <Archive className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
                        <AlertCircle className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No items found</p>
                      </td>
                    </tr>
                  )
                ) : (
                  filteredCategories.length > 0 ? (
                    filteredCategories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="text-sm font-black text-slate-800 tracking-tight">{cat.name}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-slate-500 line-clamp-1">{cat.description || 'No description'}</p>
                        </td>
                        <td className="px-6 py-4">
                          {cat.isActive ? (
                            <span className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                              <CheckCircle2 className="h-3 w-3" />
                              Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                              <XCircle className="h-3 w-3" />
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => openCategoryModal(cat)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                              <Archive className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center">
                        <AlertCircle className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No categories found</p>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Item Modal */}
      {showModal === 'item' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-800 tracking-tight">
                  {editingId ? 'Edit Item / Service' : 'Add New Item / Service'}
                </h2>
                <button onClick={() => setShowModal(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                  <XCircle className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSaveItem} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Code</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                      value={itemForm.code}
                      onChange={(e) => setItemForm({ ...itemForm, code: e.target.value })}
                      placeholder="e.g. LAB-001"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                    <select
                      required
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                      value={itemForm.categoryId}
                      onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Item / Service Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    placeholder="e.g. CBC with Platelet Count"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                    value={itemForm.description}
                    onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                    placeholder="Provide details about the item or service..."
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input 
                    type="checkbox"
                    id="itemIsActive"
                    checked={itemForm.isActive}
                    onChange={(e) => setItemForm({ ...itemForm, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="itemIsActive" className="text-xs font-black text-slate-700 uppercase tracking-widest cursor-pointer">Active in Catalog</label>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                  >
                    {editingId ? 'Update Catalog Item' : 'Create Catalog Item'}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showModal === 'category' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-800 tracking-tight">
                  {editingId ? 'Edit Category' : 'Add New Category'}
                </h2>
                <button onClick={() => setShowModal(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                  <XCircle className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSaveCategory} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    placeholder="e.g. Laboratory"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    placeholder="Describe what this category encompasses..."
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input 
                    type="checkbox"
                    id="catIsActive"
                    checked={categoryForm.isActive}
                    onChange={(e) => setCategoryForm({ ...categoryForm, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="catIsActive" className="text-xs font-black text-slate-700 uppercase tracking-widest cursor-pointer">Active</label>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                  >
                    {editingId ? 'Update Category' : 'Create Category'}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CatalogManagementPage;

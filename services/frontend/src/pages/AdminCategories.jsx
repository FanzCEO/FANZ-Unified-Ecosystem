import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Move, Eye, EyeOff, Save, X, ChevronUp, ChevronDown } from 'lucide-react';

const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    color: '#6B46C1'
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/admin/explore/categories', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    try {
      const response = await fetch('/api/v1/admin/explore/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setShowCreateModal(false);
        resetForm();
        loadCategories();
        alert('Category created successfully!');
      }
    } catch (error) {
      console.error('Failed to create category:', error);
      alert('Failed to create category');
    }
  };

  const handleUpdateCategory = async () => {
    try {
      const response = await fetch(`/api/v1/admin/explore/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setEditingCategory(null);
        resetForm();
        loadCategories();
        alert('Category updated successfully!');
      }
    } catch (error) {
      console.error('Failed to update category:', error);
      alert('Failed to update category');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      const response = await fetch(`/api/v1/admin/explore/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      
      if (response.ok) {
        loadCategories();
        alert('Category deleted successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Failed to delete category');
    }
  };

  const handleToggleActive = async (category) => {
    const endpoint = category.is_active ? 'deactivate' : 'activate';
    
    try {
      const response = await fetch(`/api/v1/admin/explore/categories/${category.id}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      
      if (response.ok) {
        loadCategories();
      }
    } catch (error) {
      console.error('Failed to toggle category status:', error);
    }
  };

  const handleMoveCategory = async (categoryId, direction) => {
    const index = categories.findIndex(c => c.id === categoryId);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === categories.length - 1)) {
      return;
    }
    
    const newOrder = [...categories];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newOrder[index], newOrder[swapIndex]] = [newOrder[swapIndex], newOrder[index]];
    
    // Update positions
    const orderData = newOrder.map((cat, idx) => ({
      id: cat.id,
      position: idx + 1
    }));
    
    try {
      const response = await fetch('/api/v1/admin/explore/categories/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ order: orderData })
      });
      
      if (response.ok) {
        setCategories(newOrder);
      }
    } catch (error) {
      console.error('Failed to reorder categories:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      icon: '',
      color: '#6B46C1'
    });
  };

  const startEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      icon: category.icon || '',
      color: category.color || '#6B46C1'
    });
  };

  const CategoryModal = ({ isEdit = false }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {isEdit ? 'Edit Category' : 'Create New Category'}
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 border rounded-lg"
              placeholder="e.g., Fitness"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Slug *</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
              className="w-full p-2 border rounded-lg"
              placeholder="e.g., fitness"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 border rounded-lg"
              rows="3"
              placeholder="Category description..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Icon (Emoji)</label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              className="w-full p-2 border rounded-lg"
              placeholder="e.g., 💪"
              maxLength="2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-12 h-10 border rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="flex-1 p-2 border rounded-lg"
                placeholder="#6B46C1"
              />
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => {
              isEdit ? handleUpdateCategory() : handleCreateCategory();
            }}
            className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isEdit ? 'Update' : 'Create'}
          </button>
          <button
            onClick={() => {
              isEdit ? setEditingCategory(null) : setShowCreateModal(false);
              resetForm();
            }}
            className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Category Management</h1>
              <p className="text-gray-600 mt-1">Manage creator categories for the explore section</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Category
            </button>
          </div>
        </div>
        
        {/* Categories List */}
        <div className="bg-white rounded-lg shadow-sm">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p className="mt-4 text-gray-600">Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600 mb-4">No categories found</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
              >
                Create First Category
              </button>
            </div>
          ) : (
            <div className="divide-y">
              {categories.map((category, index) => (
                <div key={category.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Position Controls */}
                      <div className="flex flex-col">
                        <button
                          onClick={() => handleMoveCategory(category.id, 'up')}
                          disabled={index === 0}
                          className={`p-1 rounded ${index === 0 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-200'}`}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMoveCategory(category.id, 'down')}
                          disabled={index === categories.length - 1}
                          className={`p-1 rounded ${index === categories.length - 1 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-200'}`}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Category Info */}
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                        style={{ backgroundColor: category.color + '20', color: category.color }}
                      >
                        {category.icon || '📁'}
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          {category.name}
                          {!category.is_active && (
                            <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded">Inactive</span>
                          )}
                        </h3>
                        <p className="text-gray-500 text-sm">/{category.slug}</p>
                        {category.description && (
                          <p className="text-gray-600 text-sm mt-1">{category.description}</p>
                        )}
                        <p className="text-gray-500 text-xs mt-1">
                          {category.creator_count || 0} creators
                        </p>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(category)}
                        className={`p-2 rounded-lg ${
                          category.is_active 
                            ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={category.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {category.is_active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      </button>
                      
                      <button
                        onClick={() => startEdit(category)}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                        title="Edit"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                        title="Delete"
                        disabled={category.creator_count > 0}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Featured Creators Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Featured Creators Management</h2>
          <p className="text-gray-600 mb-4">
            Manage which creators appear in the featured section of the explore page
          </p>
          <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
            Manage Featured Creators
          </button>
        </div>
      </div>
      
      {/* Modals */}
      {showCreateModal && <CategoryModal />}
      {editingCategory && <CategoryModal isEdit />}
    </div>
  );
};

export default AdminCategoriesPage;
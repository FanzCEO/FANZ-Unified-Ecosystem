import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Filter, Search, Code, FileText, AlertCircle, Clock } from 'lucide-react';

const AdminTodosPage = () => {
  const [todos, setTodos] = useState([]);
  const [filteredTodos, setFilteredTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadTodos();
  }, []);

  useEffect(() => {
    filterTodos();
  }, [todos, searchTerm, serviceFilter, statusFilter]);

  const loadTodos = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/admin/todos', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      const data = await response.json();
      setTodos(data.todos || []);
    } catch (error) {
      console.error('Failed to load todos:', error);
      // Mock data for development
      setTodos([
        {
          id: 1,
          text: 'Upload to S3 or similar storage service',
          file: 'services/user-service/handlers/profile.go',
          line: 45,
          service: 'user-service',
          completed: false,
          priority: 'medium',
          createdAt: '2024-01-15T10:30:00Z'
        },
        {
          id: 2,
          text: 'Send actual email using SendGrid or similar service',
          file: 'services/user-service/handlers/auth.go',
          line: 78,
          service: 'user-service',
          completed: false,
          priority: 'high',
          createdAt: '2024-01-14T14:20:00Z'
        },
        {
          id: 3,
          text: 'Implement proper encryption for sensitive data',
          file: 'services/user-service/handlers/verification.go',
          line: 123,
          service: 'user-service',
          completed: false,
          priority: 'high',
          createdAt: '2024-01-13T09:15:00Z'
        },
        {
          id: 4,
          text: 'Send to third-party age verification service (VerifyMy)',
          file: 'services/user-service/handlers/verification.go',
          line: 145,
          service: 'user-service',
          completed: false,
          priority: 'medium',
          createdAt: '2024-01-12T16:45:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filterTodos = () => {
    let filtered = todos;

    if (searchTerm) {
      filtered = filtered.filter(todo =>
        todo.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        todo.file.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (serviceFilter !== 'all') {
      filtered = filtered.filter(todo => todo.service === serviceFilter);
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'completed') {
        filtered = filtered.filter(todo => todo.completed);
      } else if (statusFilter === 'pending') {
        filtered = filtered.filter(todo => !todo.completed);
      }
    }

    setFilteredTodos(filtered);
  };

  const toggleTodoStatus = async (todoId) => {
    try {
      const response = await fetch(`/api/v1/admin/todos/${todoId}/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      
      if (response.ok) {
        setTodos(todos.map(todo =>
          todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
        ));
      }
    } catch (error) {
      console.error('Failed to toggle todo status:', error);
      // Optimistically update UI even if API fails (for development)
      setTodos(todos.map(todo =>
        todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
      ));
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getServiceBadgeColor = (service) => {
    const colors = {
      'user-service': 'bg-blue-100 text-blue-800',
      'content-service': 'bg-green-100 text-green-800',
      'payment-service': 'bg-purple-100 text-purple-800',
      'explore-service': 'bg-orange-100 text-orange-800',
      'api-gateway': 'bg-red-100 text-red-800',
    };
    return colors[service] || 'bg-gray-100 text-gray-800';
  };

  const services = [...new Set(todos.map(todo => todo.service))];
  const completedCount = todos.filter(todo => todo.completed).length;
  const totalCount = todos.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading TODO items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Developer TODOs</h1>
        <p className="text-gray-600 mt-2">
          Manage and track TODO items across all microservices
        </p>
        
        {/* Stats */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total TODOs</p>
                <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{totalCount - completedCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search TODOs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Services</option>
            {services.map(service => (
              <option key={service} value={service}>{service}</option>
            ))}
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* TODO List */}
      <div className="bg-white rounded-lg shadow-sm">
        {filteredTodos.length === 0 ? (
          <div className="text-center py-12">
            <Code className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No TODOs found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || serviceFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'All caught up! No TODO items found.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTodos.map((todo) => (
              <div key={todo.id} className={`p-6 hover:bg-gray-50 ${todo.completed ? 'opacity-60' : ''}`}>
                <div className="flex items-start space-x-4">
                  <button
                    onClick={() => toggleTodoStatus(todo.id)}
                    className="mt-1 flex-shrink-0"
                  >
                    {todo.completed ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400 hover:text-purple-600" />
                    )}
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={`text-lg font-medium ${todo.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {todo.text}
                        </p>
                        
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <FileText className="h-4 w-4 mr-1" />
                            {todo.file}:{todo.line}
                          </span>
                          
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getServiceBadgeColor(todo.service)}`}>
                            {todo.service}
                          </span>
                          
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(todo.priority)}`}>
                            {todo.priority} priority
                          </span>
                        </div>
                        
                        <p className="mt-1 text-xs text-gray-400">
                          Added {new Date(todo.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      {todo.priority === 'high' && !todo.completed && (
                        <AlertCircle className="h-5 w-5 text-red-500 ml-2" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTodosPage;
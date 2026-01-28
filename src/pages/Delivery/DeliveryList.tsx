import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { apiRequest, parseApiResponse } from "../../config/api";

interface DeliveryAgent {
  _id: string;
  name: string;
  email: string;
  phone: string;
  vehicleType: string;
  vehicleNumber?: string;
  totalDeliveries: number;
  completedDeliveries?: number;
  availability: boolean;
  status?: string;
  joinedDate?: string;
  image?: string;
  rating: number;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
}

export default function DeliveryList() {
  const navigate = useNavigate();
  const [deliveryData, setDeliveryData] = useState<DeliveryAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<DeliveryAgent | null>(null);
  const [editFormData, setEditFormData] = useState<{
    name: string;
    email: string;
    phone: string;
    vehicleType: string;
    vehicleNumber: string;
    password?: string;
  } | null>(null);
  const itemsPerPage = 10;

  // Fetch delivery partners on component mount
  useEffect(() => {
    fetchDeliveryPartners();
  }, []);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchDeliveryPartners = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('delivery/partners');
      const data = await parseApiResponse(response);
      
      if (data.status === 'success' && data.data) {
        // Map backend data to match our interface
        const partners = data.data.partners.map((p: any) => ({
          ...p,
          completedDeliveries: p.totalDeliveries, // Assuming completed = total for now
          status: p.availability ? "Active" : "Inactive",
          joinedDate: new Date().toISOString().split('T')[0], // Default date if not provided
        }));
        setDeliveryData(partners);
      }
    } catch (error: any) {
      console.error('Failed to fetch delivery partners:', error);
      showNotification(error.message || 'Failed to load delivery partners', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    try {
      const response = await apiRequest(`delivery/partner/${agentId}`, {
        method: 'DELETE',
      });
      
      const data = await parseApiResponse(response);
      
      if (data.status === 'success') {
        showNotification('Delivery partner deleted successfully', 'success');
        // Remove from local state
        setDeliveryData(prev => prev.filter(agent => agent._id !== agentId));
        setDeleteConfirm(null);
      } else {
        showNotification(data.message || 'Failed to delete delivery partner', 'error');
      }
    } catch (error: any) {
      console.error('Error deleting delivery partner:', error);
      showNotification(error.message || 'Failed to delete delivery partner', 'error');
    }
  };

  const handleEditAgent = (agent: DeliveryAgent) => {
    setEditingAgent(agent);
    setEditFormData({
      name: agent.name,
      email: agent.email,
      phone: agent.phone,
      vehicleType: agent.vehicleType,
      vehicleNumber: agent.vehicleNumber || '',
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingAgent(null);
    setEditFormData(null);
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (!editFormData) return;
    setEditFormData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData || !editingAgent) return;

    try {
      setLoading(true);
      
      const requestData: any = {
        name: editFormData.name,
        email: editFormData.email,
        phone: editFormData.phone,
        vehicleType: editFormData.vehicleType.toLowerCase(),
      };

      // Only include password if it's provided
      if (editFormData.password && editFormData.password.length >= 6) {
        requestData.password = editFormData.password;
      }
      
      const response = await apiRequest(`delivery/partner/${editingAgent._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      const data = await parseApiResponse(response);
      
      if (data.status === 'success') {
        showNotification('Delivery partner updated successfully!', 'success');
        closeEditModal();
        // Refresh the list
        fetchDeliveryPartners();
      } else {
        showNotification(data.message || 'Failed to update delivery partner', 'error');
      }
    } catch (error: any) {
      console.error('Error updating delivery partner:', error);
      showNotification(error.message || 'Failed to update delivery partner', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter delivery agents
  const filteredAndSortedAgents = deliveryData
    .filter((agent) => {
      const matchesSearch = 
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.phone.includes(searchTerm) ||
        (agent.vehicleNumber && agent.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesSearch;
    });

  // Calculate pagination
  const totalPages = Math.ceil(filteredAndSortedAgents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAgents = filteredAndSortedAgents.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <>
      <PageMeta
        title="Delivery Agents | Admin Dashboard"
        description="View and manage all delivery agents"
      />
      <PageBreadcrumb pageTitle="Delivery Agents" />
      
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[100000] rounded-lg px-4 py-3 shadow-lg ${
          notification.type === 'success'
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}
      
      {/* Add Agent Button */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => navigate('/admin/delivery/add')}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors flex items-center gap-2"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Delivery Agent
        </button>
      </div>
      
      {/* Search and Filter Section */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by name, email, phone, or vehicle..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pl-10 text-sm text-gray-700 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:placeholder-gray-500"
          />
          <svg
            className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

      </div>

      {/* Results Summary */}
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Showing {startIndex + 1} to {Math.min(endIndex, filteredAndSortedAgents.length)} of {filteredAndSortedAgents.length} agents
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading delivery agents...</span>
        </div>
      ) : deliveryData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <svg className="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-gray-600 dark:text-gray-400 text-lg">No delivery agents found</p>
          <button
            onClick={() => navigate('/admin/delivery/add')}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            Add First Agent
          </button>
        </div>
      ) : (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <th className="px-4 py-3 text-left">Agent</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentAgents.map((agent) => (
                <TableRow key={agent._id}>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold">
                          {agent.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white/90">
                            {agent.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Joined {agent.joinedDate ? new Date(agent.joinedDate).toLocaleDateString() : 'Recently'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="text-sm">
                        <div className="text-gray-900 dark:text-white/90">{agent.email}</div>
                        <div className="text-gray-500 dark:text-gray-400">{agent.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEditAgent(agent)}
                          className="rounded-lg bg-gray-100 p-1.5 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {deleteConfirm === agent._id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteAgent(agent._id)}
                              className="rounded-lg bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="rounded-lg bg-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setDeleteConfirm(agent._id)}
                            className="rounded-lg bg-red-50 p-1.5 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      )}

      {/* Pagination */}
      {!loading && deliveryData.length > 0 && (
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Previous
          </button>
          
          {/* Page Numbers */}
          <div className="hidden items-center gap-1 sm:flex">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNumber;
              if (totalPages <= 5) {
                pageNumber = i + 1;
              } else if (currentPage <= 3) {
                pageNumber = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + i;
              } else {
                pageNumber = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNumber}
                  onClick={() => goToPage(pageNumber)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    currentPage === pageNumber
                      ? "bg-indigo-600 text-white dark:bg-indigo-500"
                      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Next
          </button>
        </div>
      </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editFormData && editingAgent && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-[9999998] transition-opacity"
            onClick={closeEditModal}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4">
            <div className="no-scrollbar relative w-full max-w-[600px] max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-gray-900 p-6 lg:p-8">
              {/* Header */}
              <div className="mb-5 pr-14">
                <h4 className="mb-2 text-lg font-medium text-gray-800 dark:text-white/90">
                  Edit Delivery Agent
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Update agent details
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={closeEditModal}
                className="absolute right-5 top-5 rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Form */}
              <form onSubmit={handleEditSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={editFormData.name}
                    onChange={handleEditInputChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={editFormData.email}
                    onChange={handleEditInputChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={editFormData.phone}
                    onChange={handleEditInputChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                  />
                </div>

                {/* Vehicle Type */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Vehicle Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="vehicleType"
                    required
                    value={editFormData.vehicleType}
                    onChange={handleEditInputChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                  >
                    <option value="">Select vehicle type</option>
                    <option value="bike">Bike</option>
                    <option value="scooter">Scooter</option>
                    <option value="car">Car</option>
                  </select>
                </div>

                {/* Vehicle Number */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Vehicle Number
                  </label>
                  <input
                    type="text"
                    name="vehicleNumber"
                    value={editFormData.vehicleNumber}
                    onChange={handleEditInputChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                    placeholder="e.g., BK-1234"
                  />
                </div>

                {/* Password (optional) */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    New Password (optional)
                  </label>
                  <input
                    type="password"
                    name="password"
                    minLength={6}
                    value={editFormData.password || ''}
                    onChange={handleEditInputChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                    placeholder="Leave blank to keep current password"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Minimum 6 characters. Leave empty to keep current password.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-indigo-500 dark:hover:bg-indigo-600 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      'Update Agent'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}

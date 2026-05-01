import { Fragment, useState, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { getCustomers, toggleBlockCustomer, deleteCustomer, Customer } from "../../services/customer.service";
import { logger } from "../../utils/logger";

type CustomerSortOption = "-createdAt" | "-customerData.totalOrders" | "customerData.totalOrders" | "-customerData.totalSpent" | "customerData.totalSpent";

export default function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<CustomerSortOption>("-createdAt");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const itemsPerPage = 10;

  // Helper functions to handle both flat and nested data structures
  const getName = (customer: Customer) => {
    if (typeof customer.name === 'string') {
      const parts = customer.name.split(' ');
      return {
        first: parts[0] || 'Unknown',
        last: parts.slice(1).join(' ') || '',
        full: customer.name
      };
    }
    return {
      first: customer.name?.first || 'Unknown',
      last: customer.name?.last || '',
      full: `${customer.name?.first || ''} ${customer.name?.last || ''}`.trim()
    };
  };

  const getEmail = (customer: Customer) => {
    if (typeof customer.email === 'string') {
      return { address: customer.email, isVerified: false };
    }
    return customer.email || { address: 'N/A', isVerified: false };
  };

  const getPhone = (customer: Customer) => {
    if (typeof customer.phone === 'string') {
      return { number: customer.phone, isVerified: false };
    }
    return customer.phone || { number: 'N/A', isVerified: false };
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setCurrentPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, searchTerm, sortBy]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await getCustomers({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        role: 'customer',
        sort: sortBy,
      });
      
      setCustomers(response.data.users);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalResults(response.pagination?.totalResults || 0);
    } catch (error) {
      logger.error('Error fetching customers', {
        message: error instanceof Error ? error.message : 'Unknown error',
        error,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async (customerId: string, currentlyBlocked: boolean) => {
    try {
      setActionLoadingId(customerId);
      const updated = await toggleBlockCustomer(
        customerId,
        !currentlyBlocked,
        !currentlyBlocked ? 'Blocked by admin' : ''
      );

      setCustomers((prev) =>
        prev.map((customer) =>
          customer._id === customerId
            ? { ...customer, isBlocked: updated.isBlocked }
            : customer
        )
      );
    } catch (error) {
      logger.error('Error toggling customer block status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (customerId: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await deleteCustomer(customerId);
        fetchCustomers();
      } catch (error) {
        logger.error('Error deleting customer');
      }
    }
  };

  const toggleExpand = (customerId: string) => {
    setExpandedCustomerId(expandedCustomerId === customerId ? null : customerId);
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
  };

  const handleSortChange = (value: CustomerSortOption) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    setExpandedCustomerId(null); // Close expanded row when changing pages
  };

  return (
    <>
      <PageMeta
        title="Customer List | Admin Dashboard"
        description="View and manage all customers"
      />
      <PageBreadcrumb pageTitle="Customer List" />
      
      {/* Search and Filter Section */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchInput}
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

        <div className="w-full sm:w-64">
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value as CustomerSortOption)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <option value="-createdAt">Newest first</option>
            <option value="-customerData.totalOrders">Total orders: high to low</option>
            <option value="customerData.totalOrders">Total orders: low to high</option>
            <option value="-customerData.totalSpent">Total spent: high to low</option>
            <option value="customerData.totalSpent">Total spent: low to high</option>
          </select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        {loading ? 'Loading...' : `Showing ${((currentPage - 1) * itemsPerPage) + 1} to ${Math.min(currentPage * itemsPerPage, totalResults)} of ${totalResults} customers`}
      </div>
      
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Customer
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Contact
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Total Orders
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Total Spent
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Status
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                    Loading customers...
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                    No customers found matching your search criteria.
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => {
                  const name = getName(customer);
                  const email = getEmail(customer);
                  const phone = getPhone(customer);
                  
                  return (
                    <Fragment key={customer._id}>
                      <TableRow className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                        <TableCell className="px-5 py-4 sm:px-6 text-start">
                          <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleExpand(customer._id)}>
                            <svg
                              className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${expandedCustomerId === customer._id ? 'rotate-90' : ''}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <div className="w-10 h-10 overflow-hidden rounded-full flex-shrink-0 bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                              {name.first.charAt(0)}{name.last.charAt(0) || 'U'}
                            </div>
                            <div>
                              <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                {name.full}
                              </span>
                              <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                                Joined {new Date(customer.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          <div className="cursor-pointer" onClick={() => toggleExpand(customer._id)}>
                            <div className="text-gray-800 dark:text-white/90">{email.address}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{phone.number}</div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                          <div className="cursor-pointer" onClick={() => toggleExpand(customer._id)}>
                            {customer.customerData?.totalOrders || 0}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                          <div className="cursor-pointer" onClick={() => toggleExpand(customer._id)}>
                            ₹{(customer.customerData?.totalSpent || 0).toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              customer.isBlocked
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            }`}
                          >
                            {customer.isBlocked ? 'Blocked' : 'Active'}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleBlock(customer._id, customer.isBlocked)}
                              disabled={actionLoadingId === customer._id}
                              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                customer.isBlocked
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400'
                              } ${actionLoadingId === customer._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {actionLoadingId === customer._id
                                ? 'Updating...'
                                : customer.isBlocked
                                  ? 'Unblock'
                                  : 'Block'}
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedCustomerId === customer._id && (
                        <TableRow>
                          <TableCell colSpan={6} className="px-5 py-4 bg-gray-50 dark:bg-white/[0.02]">
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Customer Details */}
                                <div>
                                  <h4 className="font-semibold text-gray-800 dark:text-white/90 text-sm mb-2">
                                    Customer Information
                                  </h4>
                                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                    <p><span className="font-medium text-gray-700 dark:text-gray-300">Name:</span> {name.full}</p>
                                    <p><span className="font-medium text-gray-700 dark:text-gray-300">Email:</span> {email.address} {email.isVerified && <span className="text-green-600">✓</span>}</p>
                                    <p><span className="font-medium text-gray-700 dark:text-gray-300">Phone:</span> {phone.number} {phone.isVerified && <span className="text-green-600">✓</span>}</p>
                                    <p><span className="font-medium text-gray-700 dark:text-gray-300">Joined:</span> {new Date(customer.createdAt).toLocaleDateString()}</p>
                                  </div>
                                </div>

                                {/* Address */}
                                <div>
                                  <h4 className="font-semibold text-gray-800 dark:text-white/90 text-sm mb-2">
                                    Address
                                  </h4>
                                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                    {customer.addresses && customer.addresses.length > 0 ? (
                                      <>
                                        <p>{customer.addresses[0].street}</p>
                                        {customer.addresses[0].apartment && <p>Apt: {customer.addresses[0].apartment}</p>}
                                        <p>{customer.addresses[0].city}, {customer.addresses[0].state} {customer.addresses[0].zipCode}</p>
                                        {customer.addresses[0].landmark && <p className="text-xs">Landmark: {customer.addresses[0].landmark}</p>}
                                      </>
                                    ) : (
                                      <p>No address added</p>
                                    )}
                                  </div>
                                </div>

                                {/* Order Statistics */}
                                <div>
                                  <h4 className="font-semibold text-gray-800 dark:text-white/90 text-sm mb-2">
                                    Order Statistics
                                  </h4>
                                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                    <p><span className="font-medium text-gray-700 dark:text-gray-300">Total Orders:</span> {customer.customerData?.totalOrders || 0}</p>
                                    <p><span className="font-medium text-gray-700 dark:text-gray-300">Total Spent:</span> ₹{(customer.customerData?.totalSpent || 0).toFixed(2)}</p>
                                    <p><span className="font-medium text-gray-700 dark:text-gray-300">Loyalty Points:</span> {customer.customerData?.loyaltyPoints || 0}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                                <button 
                                  onClick={() => handleToggleBlock(customer._id, customer.isBlocked)}
                                  disabled={actionLoadingId === customer._id}
                                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                                    customer.isBlocked
                                      ? 'border-green-300 bg-white text-green-600 hover:bg-green-50 dark:border-green-700 dark:bg-gray-800 dark:text-green-400 dark:hover:bg-green-500/10'
                                      : 'border-orange-300 bg-white text-orange-600 hover:bg-orange-50 dark:border-orange-700 dark:bg-gray-800 dark:text-orange-400 dark:hover:bg-orange-500/10'
                                  } ${actionLoadingId === customer._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  {actionLoadingId === customer._id
                                    ? 'Updating...'
                                    : customer.isBlocked
                                      ? 'Unblock Customer'
                                      : 'Block Customer'}
                                </button>
                                <button 
                                  onClick={() => handleDelete(customer._id)}
                                  className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-700 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-500/10"
                                >
                                  Delete Customer
                                </button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalResults > 0 && (
        <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
          {/* Page Info */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                currentPage === 1
                  ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              Previous
            </button>

            {/* Page Numbers */}
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current
                const showPage =
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1);

                const showEllipsis =
                  (page === currentPage - 2 && currentPage > 3) ||
                  (page === currentPage + 2 && currentPage < totalPages - 2);

                if (showEllipsis) {
                  return (
                    <span
                      key={page}
                      className="px-3 py-2 text-sm text-gray-400 dark:text-gray-600"
                    >
                      ...
                    </span>
                  );
                }

                if (!showPage) return null;

                return (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      currentPage === page
                        ? "bg-indigo-600 text-white dark:bg-indigo-500"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                currentPage === totalPages
                  ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
}
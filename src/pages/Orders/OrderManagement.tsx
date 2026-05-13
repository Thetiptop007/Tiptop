import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { useOrdersOrchestrator } from "../../features/orders/hooks/useOrdersOrchestrator";
import { OrdersTable } from "../../features/orders/components/OrdersTable";
import { AssignPartnerModal } from "../../features/orders/components/AssignPartnerModal";
import { QueryBoundary } from "../../components/common/QueryBoundary";
import { TableSkeleton } from "../../components/ui/skeletons/TableSkeleton";
import { Pagination } from "../../components/common/Pagination";

export default function OrderManagement() {
  const { 
    tab, 
    setTab, 
    currentPage,
    setCurrentPage,
    todayQuery, 
    allOrdersQuery,
    pagination,
    actions, 
    modals 
  } = useOrdersOrchestrator();

  const activeQuery = tab === 'today' ? todayQuery : allOrdersQuery;

  return (
    <>
      <PageMeta
        title="Order Management | The Tip Top Admin"
        description="Manage and track restaurant orders in real-time"
      />
      
      <PageBreadcrumb pageTitle="Order Management" />

      {/* View Toggle Buttons */}
      <div className="mb-6 flex items-center gap-2">
        <button
          onClick={() => setTab('today')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "today"
              ? "bg-indigo-600 text-white dark:bg-indigo-500"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setTab('all')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "all"
              ? "bg-indigo-600 text-white dark:bg-indigo-500"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          All
        </button>
        
        {/* Refresh Button */}
        <button
          onClick={() => activeQuery.refetch()}
          disabled={activeQuery.isFetching}
          className="ml-auto rounded-lg bg-gray-100 px-3 py-2 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh orders"
        >
          <svg 
            className={`h-5 w-5 ${activeQuery.isFetching ? 'animate-spin' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357-2H15" 
            />
          </svg>
        </button>
      </div>

      {tab === 'today' ? (
        <QueryBoundary
          query={todayQuery}
          loadingComponent={
            <div className="space-y-6">
              <TableSkeleton rows={3} columns={7} />
              <TableSkeleton rows={5} columns={7} />
            </div>
          }
        >
          {(data) => (
            <div className="space-y-6 pb-20">
              <OrdersTable
                title="New Orders"
                orders={data.pending || []}
                badgeColor="indigo"
                onStatusUpdate={actions.updateStatus}
                showBulkControls
                onBulkUpdate={(ids) => actions.bulkUpdateStatus(ids, 'ACCEPTED')}
              />

              <OrdersTable
                title="Accepted & Preparing"
                orders={data.accepted || []}
                badgeColor="blue"
                onStatusUpdate={actions.updateStatus}
                showBulkControls
                onBulkUpdate={(ids) => actions.bulkUpdateStatus(ids, 'READY')}
              />

              <OrdersTable
                title="Ready for Delivery"
                orders={data.ready || []}
                badgeColor="purple"
                onStatusUpdate={actions.updateStatus}
                onAssignClick={(id) => actions.openAssignModal([id])}
                showBulkControls
                onBulkUpdate={(ids) => actions.openAssignModal(ids)}
              />

              <OrdersTable
                title="Out for Delivery"
                orders={data.out_for_delivery || []}
                badgeColor="emerald"
                onStatusUpdate={actions.updateStatus}
              />

              <div className="pt-8 border-t border-gray-100 dark:border-gray-800 space-y-8">
                <h3 className="text-gray-400 font-bold uppercase text-xs tracking-widest">Completed / Cancelled</h3>
                <OrdersTable
                  title="Delivered"
                  orders={data.delivered || []}
                  badgeColor="green"
                  onStatusUpdate={actions.updateStatus}
                />
                <OrdersTable
                  title="Cancelled"
                  orders={data.cancelled || []}
                  badgeColor="red"
                  onStatusUpdate={actions.updateStatus}
                />
              </div>
            </div>
          )}
        </QueryBoundary>
      ) : (
        <QueryBoundary
          query={allOrdersQuery}
          loadingComponent={<TableSkeleton rows={10} columns={7} />}
        >
          {(data) => (
            <div className="space-y-6 pb-20">
              <OrdersTable
                title="Order History"
                orders={data?.orders || []}
                onStatusUpdate={actions.updateStatus}
              />
              
              {pagination && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={pagination.totalPages}
                  totalResults={pagination.totalOrders}
                  itemsPerPage={pagination.limit}
                  onPageChange={setCurrentPage}
                  isLoading={allOrdersQuery.isFetching}
                />
              )}
            </div>
          )}
        </QueryBoundary>
      )}

      <AssignPartnerModal
        isOpen={modals.assign.isOpen}
        onClose={modals.assign.close}
        selectedOrderIds={modals.assign.selectedIds}
        partners={modals.assign.partners}
        isAssigning={modals.assign.isAssigning}
        onAssign={modals.assign.onAssign}
      />
    </>
  );
}

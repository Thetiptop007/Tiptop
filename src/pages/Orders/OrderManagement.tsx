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
      <div className="mb-6 flex items-center gap-3">
        <div className="flex bg-gray-100 dark:bg-white/[0.05] p-1 rounded-xl">
          <button
            onClick={() => setTab('today')}
            className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
              tab === "today"
                ? "bg-white text-indigo-600 shadow-sm dark:bg-indigo-600 dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setTab('all')}
            className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
              tab === "all"
                ? "bg-white text-indigo-600 shadow-sm dark:bg-indigo-600 dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            All
          </button>
        </div>
        
        {/* Refresh Button */}
        <button
          onClick={() => activeQuery.refetch()}
          disabled={activeQuery.isFetching}
          className="ml-auto flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-white/[0.05] dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.08] transition-all disabled:opacity-50"
          title="Refresh orders"
        >
          <svg 
            className={`h-4 w-4 ${activeQuery.isFetching ? 'animate-spin' : ''}`}
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
          <span>Refresh</span>
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
                bulkActionLabel="Accept Selected"
                onBulkUpdate={(ids) => actions.bulkUpdateStatus(ids, 'ACCEPTED')}
              />

              <OrdersTable
                title="Accepted & Preparing"
                orders={data.accepted || []}
                badgeColor="blue"
                onStatusUpdate={actions.updateStatus}
                showBulkControls
                bulkActionLabel="Mark Ready"
                onBulkUpdate={(ids) => actions.bulkUpdateStatus(ids, 'READY')}
              />

              <OrdersTable
                title="Ready for Delivery"
                orders={data.ready || []}
                badgeColor="purple"
                onStatusUpdate={actions.updateStatus}
                onAssignClick={(id) => actions.openAssignModal([id])}
                showBulkControls
                bulkActions={[
                  {
                    label: "Assign Selected",
                    onExecute: (ids) => actions.openAssignModal(ids),
                    className: "border-indigo-100 bg-indigo-50/50 text-indigo-600 hover:bg-indigo-600 hover:text-white dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-600 dark:hover:text-white"
                  },
                  {
                    label: "Mark Delivered",
                    onExecute: (ids) => actions.bulkUpdateStatus(ids, 'DELIVERED'),
                    className: "border-emerald-100 bg-emerald-50/50 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:text-white"
                  }
                ]}
              />

              <OrdersTable
                title="Out for Delivery"
                orders={data.out_for_delivery || []}
                badgeColor="emerald"
                onStatusUpdate={actions.updateStatus}
                showBulkControls
                bulkActionLabel="Mark Delivered"
                onBulkUpdate={(ids) => actions.bulkUpdateStatus(ids, 'DELIVERED')}
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

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Skeleton from "../ui/Skeleton";

interface RecentOrder {
  orderNumber: string;
  productName: string;
  productImage: string;
  itemCount: number;
  category: string;
  totalPrice: number;
  status: string;
}

interface RecentOrdersProps {
  orders?: RecentOrder[];
  loading?: boolean;
}

export default function RecentOrders({ orders = [], loading }: RecentOrdersProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(price);
  };


  return (
    <div className="h-full overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Recent Orders
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
            See all
          </button>
        </div>
      </div>
      
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Products
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Price
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Status
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-[50px] w-[50px] bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : orders.length === 0 ? (
              // Empty state
              <TableRow>
                <TableCell className="py-8">
                  <div className="text-center text-gray-500 dark:text-gray-400 w-full">
                    No recent orders found
                  </div>
                </TableCell>
                <TableCell className="py-8"> </TableCell>
                <TableCell className="py-8"> </TableCell>
              </TableRow>
            ) : (
              // Actual orders
              orders.map((order, index) => (
                <TableRow key={index}>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-[50px] w-[50px] overflow-hidden rounded-md">
                        {order.productImage ? (
                          <img
                            src={order.productImage}
                            className="h-[50px] w-[50px] object-cover"
                            alt={order.productName}
                          />
                        ) : (
                          <div className="h-[50px] w-[50px] bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">No image</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {order.productName}
                        </p>
                        <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                          {order.itemCount} {order.itemCount === 1 ? 'Item' : 'Items'}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {formatPrice(order.totalPrice)}
                  </TableCell>
                  <TableCell className="py-3">
                    <span className={
                      order.status === 'New'
                        ? 'inline-flex rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                        : order.status === 'Accepted'
                        ? 'inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                        : order.status === 'Preparing'
                        ? 'inline-flex rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-medium text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400'
                        : order.status === 'Ready'
                        ? 'inline-flex rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-600 dark:bg-purple-500/10 dark:text-purple-400'
                        : order.status === 'Delivered'
                        ? 'inline-flex rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-600 dark:bg-green-500/10 dark:text-green-400'
                        : order.status === 'Canceled'
                        ? 'inline-flex rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400'
                        : 'inline-flex rounded-full bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-500/10 dark:text-gray-400'
                    }>
                      {order.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

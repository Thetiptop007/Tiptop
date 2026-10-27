import { Outlet } from 'react-router-dom';
import CustomerFooter from '../components/common/CustomerFooter';
import StandardHeader from '../components/common/StandardHeader';

export default function CustomerLayout() {
  return (
    <div className="customer-panel min-h-screen bg-[#F6F5F2] text-neutral-900 font-sans flex flex-col justify-between">
      {/* Standard Universal Header */}
      <StandardHeader />

      {/* Main Outlet Body */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Cohesive Dark Footer */}
      <CustomerFooter />
    </div>
  );
}

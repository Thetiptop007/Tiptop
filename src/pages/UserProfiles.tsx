import PageBreadcrumb from "../components/common/PageBreadCrumb";
import UserMetaCard from "../components/UserProfile/UserMetaCard";
import UserInfoCard from "../components/UserProfile/UserInfoCard";
import ContactInfoCard from "../components/UserProfile/ContactInfoCard";
import OrderPricingCard from "../components/UserProfile/OrderPricingCard";
import AppUpdateCard from "../components/UserProfile/AppUpdateCard";
import AppDownloadLinksCard from "../components/UserProfile/AppDownloadLinksCard";
import ChangePasswordCard from "../components/UserProfile/ChangePasswordCard";
import ShopStatusCard from "../components/UserProfile/ShopStatusCard";
import PageMeta from "../components/common/PageMeta";

export default function UserProfiles() {
  return (
    <>
      <PageMeta
        title="Profile Dashboard | The Tip Top - Restaurant Admin Panel"
        description="Manage your profile and restaurant settings for The Tip Top"
      />
      <PageBreadcrumb pageTitle="Profile" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Profile
        </h3>
        <div className="space-y-6">
          <UserMetaCard />
          <ShopStatusCard />
          <UserInfoCard />
          <ContactInfoCard />
          <ChangePasswordCard />
          <OrderPricingCard />
          <AppDownloadLinksCard />
          <AppUpdateCard />
        </div>
      </div>
    </>
  );
}

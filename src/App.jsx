import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';

// Public Pages
import LuminaHome from './pages/LuminaHome';
import ExploreProperties from './pages/ExploreProperties';
import PropertyDetail from './pages/PropertyDetail';
import AuthSecurity from './pages/AuthSecurity';
import JournalBlog from './pages/JournalBlog';
import SavedProperties from './pages/SavedProperties';

// Legal & Company Pages
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import TermsOfService from './pages/legal/TermsOfService';
import Press from './pages/company/Press';
import Contact from './pages/company/Contact';
// Admin Pages
import CrmStrategyAdmin from './pages/CrmStrategyAdmin';
import MarketingStrategyAdmin from './pages/MarketingStrategyAdmin';
import RevenueModelAdmin from './pages/RevenueModelAdmin';
import OverviewAdmin from './pages/OverviewAdmin';
import ListingsManagerAdmin from './pages/ListingsManagerAdmin';
import SettingsAdmin from './pages/SettingsAdmin';

import NotificationsAdmin from './pages/admin/NotificationsAdmin';
import HelpSupportAdmin from './pages/admin/HelpSupportAdmin';
import UserProfileAdmin from './pages/admin/UserProfileAdmin';
import CreateListingAdmin from './pages/admin/CreateListingAdmin';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes with MainLayout */}
        <Route path="/" element={<MainLayout><LuminaHome /></MainLayout>} />
        <Route path="/explore" element={<MainLayout><ExploreProperties /></MainLayout>} />
        <Route path="/property/:id" element={<MainLayout><PropertyDetail /></MainLayout>} />
        <Route path="/auth" element={<MainLayout><AuthSecurity /></MainLayout>} />
        <Route path="/journal" element={<MainLayout><JournalBlog /></MainLayout>} />
        <Route path="/saved" element={<MainLayout><SavedProperties /></MainLayout>} />
        <Route path="/privacy" element={<MainLayout><PrivacyPolicy /></MainLayout>} />
        <Route path="/terms" element={<MainLayout><TermsOfService /></MainLayout>} />
        <Route path="/press" element={<MainLayout><Press /></MainLayout>} />
        <Route path="/contact" element={<MainLayout><Contact /></MainLayout>} />
        {/* Admin Routes with AdminLayout */}
        <Route path="/admin/crm" element={<AdminLayout><CrmStrategyAdmin /></AdminLayout>} />
        <Route path="/admin/marketing" element={<AdminLayout><MarketingStrategyAdmin /></AdminLayout>} />
        <Route path="/admin/revenue" element={<AdminLayout><RevenueModelAdmin /></AdminLayout>} />
        <Route path="/admin/overview" element={<AdminLayout><OverviewAdmin /></AdminLayout>} />
        <Route path="/admin/listings" element={<AdminLayout><ListingsManagerAdmin /></AdminLayout>} />
        <Route path="/admin/listings/new" element={<AdminLayout><CreateListingAdmin /></AdminLayout>} />
        <Route path="/admin/settings" element={<AdminLayout><SettingsAdmin /></AdminLayout>} />
        <Route path="/admin/notifications" element={<AdminLayout><NotificationsAdmin /></AdminLayout>} />
        <Route path="/admin/help" element={<AdminLayout><HelpSupportAdmin /></AdminLayout>} />
        <Route path="/admin/profile" element={<AdminLayout><UserProfileAdmin /></AdminLayout>} />
      </Routes>
    </Router>
  );
}

export default App;

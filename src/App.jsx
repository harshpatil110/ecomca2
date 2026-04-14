import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';

// Public Pages
import HomeTheArchive from './pages/HomeTheArchive';
import ExploreProperties from './pages/ExploreProperties';
import PropertyDetail from './pages/PropertyDetail';
import AuthSecurity from './pages/AuthSecurity';

// Admin Pages
import CrmStrategyAdmin from './pages/CrmStrategyAdmin';
import MarketingStrategyAdmin from './pages/MarketingStrategyAdmin';
import RevenueModelAdmin from './pages/RevenueModelAdmin';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes with MainLayout */}
        <Route path="/" element={<MainLayout><HomeTheArchive /></MainLayout>} />
        <Route path="/explore" element={<MainLayout><ExploreProperties /></MainLayout>} />
        <Route path="/property" element={<MainLayout><PropertyDetail /></MainLayout>} />
        <Route path="/auth" element={<MainLayout><AuthSecurity /></MainLayout>} />

        {/* Admin Routes with AdminLayout */}
        <Route path="/admin/crm" element={<AdminLayout><CrmStrategyAdmin /></AdminLayout>} />
        <Route path="/admin/marketing" element={<AdminLayout><MarketingStrategyAdmin /></AdminLayout>} />
        <Route path="/admin/revenue" element={<AdminLayout><RevenueModelAdmin /></AdminLayout>} />
        <Route path="/admin/overview" element={<AdminLayout><div className="pt-24 px-12"><h1 className="text-4xl font-black">Overview Dashboard</h1></div></AdminLayout>} />
      </Routes>
    </Router>
  );
}

export default App;

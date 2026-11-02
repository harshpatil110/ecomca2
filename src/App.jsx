import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import { MetaMaskProvider } from './context/MetaMaskContext';

// Public Registry Pages
import RegistryDashboard from './pages/RegistryDashboard';
import RegisterProperty from './pages/RegisterProperty';
import PropertyRecords from './pages/PropertyRecords';
import PropertyRegistryRecord from './pages/PropertyRegistryRecord';
import DocumentVerification from './pages/DocumentVerification';
import OwnershipTransfers from './pages/OwnershipTransfers';
import RegistryAnalytics from './pages/RegistryAnalytics';
import AuthSecurity from './pages/AuthSecurity';

// Legal & Company Pages
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import TermsOfService from './pages/legal/TermsOfService';
import Press from './pages/company/Press';
import Contact from './pages/company/Contact';

function App() {
  return (
    <MetaMaskProvider>
      <Router>
        <Routes>
        {/* ── Unified Registry Routes (MainLayout) ── */}
        {/* 1. Dashboard */}
        <Route path="/" element={<MainLayout><RegistryDashboard /></MainLayout>} />

        {/* 2. Register Property */}
        <Route path="/register" element={<MainLayout><RegisterProperty /></MainLayout>} />

        {/* 3. Property Records */}
        <Route path="/records" element={<MainLayout><PropertyRecords /></MainLayout>} />
        <Route path="/records/:id" element={<MainLayout><PropertyRegistryRecord /></MainLayout>} />
        <Route path="/property/:id" element={<MainLayout><PropertyRegistryRecord /></MainLayout>} />
        <Route path="/explore" element={<Navigate replace to="/records" />} />

        {/* 4. Document Verification */}
        <Route path="/verify" element={<MainLayout><DocumentVerification /></MainLayout>} />

        {/* 5. Ownership Transfers */}
        <Route path="/transfers" element={<MainLayout><OwnershipTransfers /></MainLayout>} />

        {/* 6. Registry Analytics */}
        <Route path="/analytics" element={<MainLayout><RegistryAnalytics /></MainLayout>} />

        {/* Redirect consolidated blockchain route to property records */}
        <Route path="/blockchain" element={<Navigate replace to="/records" />} />

        {/* Auth & Legal */}
        <Route path="/auth" element={<MainLayout><AuthSecurity /></MainLayout>} />
        <Route path="/privacy" element={<MainLayout><PrivacyPolicy /></MainLayout>} />
        <Route path="/terms" element={<MainLayout><TermsOfService /></MainLayout>} />
        <Route path="/press" element={<MainLayout><Press /></MainLayout>} />
        <Route path="/contact" element={<MainLayout><Contact /></MainLayout>} />

        {/* ── Admin Console Route Redirects (All features unified on main dashboard) ── */}
        <Route path="/admin" element={<Navigate replace to="/" />} />
        <Route path="/admin/overview" element={<Navigate replace to="/" />} />
        <Route path="/admin/dashboard" element={<Navigate replace to="/" />} />
        <Route path="/admin/records" element={<Navigate replace to="/records" />} />
        <Route path="/admin/register" element={<Navigate replace to="/register" />} />
        <Route path="/admin/transfers" element={<Navigate replace to="/transfers" />} />
        <Route path="/admin/verify" element={<Navigate replace to="/verify" />} />
        <Route path="/admin/analytics" element={<Navigate replace to="/analytics" />} />
        <Route path="/admin/blockchain" element={<Navigate replace to="/records" />} />
        <Route path="/admin/listings" element={<Navigate replace to="/records" />} />
        <Route path="/admin/listings/new" element={<Navigate replace to="/register" />} />
        <Route path="/admin/crm" element={<Navigate replace to="/analytics" />} />
        <Route path="/admin/marketing" element={<Navigate replace to="/analytics" />} />
        <Route path="/admin/revenue" element={<Navigate replace to="/analytics" />} />
        <Route path="/admin/*" element={<Navigate replace to="/" />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </Router>
  </MetaMaskProvider>
  );
}

export default App;

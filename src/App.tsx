import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientsPage from './pages/ClientsPage';
import CatalogPage from './pages/CatalogPage';
import OrdersPage from './pages/OrdersPage';
import GinCoinPage from './pages/GinCoinPage';
import GinCoinShopPage from './pages/GinCoinShopPage';
import RatingPage from './pages/RatingPage';
import KpiPage from './pages/KpiPage';
import SettingsPage from './pages/SettingsPage';
import ClientDetailPage from './pages/ClientDetailPage';
import CreateOrderPage from './pages/CreateOrderPage';

import NotFoundPage from './pages/NotFoundPage';
import ToastContainer from './components/Toast';

import './i18n';

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/clients/:id" element={<ClientDetailPage />} />
          <Route path="/catalog" element={
            <ProtectedRoute roles={['admin', 'manager']}><CatalogPage /></ProtectedRoute>
          } />
          <Route path="/orders/new" element={<CreateOrderPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/gincoin/shop" element={<GinCoinShopPage />} />
          <Route path="/gincoin" element={<GinCoinPage />} />
          <Route path="/rating" element={
            <ProtectedRoute roles={['admin', 'manager']}><RatingPage /></ProtectedRoute>
          } />
          <Route path="/kpi" element={
            <ProtectedRoute roles={['admin', 'manager']}><KpiPage /></ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute roles={['admin']}><SettingsPage /></ProtectedRoute>
          } />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

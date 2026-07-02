import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { CustomerRoute } from '@/components/CustomerRoute'
import { AdminLayout } from '@/components/AdminLayout'
import { StorefrontLayout } from '@/components/StorefrontLayout'
import { CatalogPage } from '@/pages/CatalogPage'
import { ProductDetailPage } from '@/pages/ProductDetailPage'
import { StorefrontAuthPage } from '@/pages/StorefrontAuthPage'
import { CartPage } from '@/pages/CartPage'
import { CheckoutPage } from '@/pages/CheckoutPage'
import { MyOrdersPage } from '@/pages/MyOrdersPage'
import { OrderDetailPage } from '@/pages/OrderDetailPage'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { VendorsPage } from '@/pages/VendorsPage'
import { OrdersPage } from '@/pages/OrdersPage'
import { AdminProductsPage } from '@/pages/AdminProductsPage'
import { BannersPage } from '@/pages/BannersPage'
import { BrandStoresPage } from '@/pages/BrandStoresPage'
import { CategoriesPage } from '@/pages/CategoriesPage'
import { CustomersPage } from '@/pages/CustomersPage'
import { CustomerDetailPage } from '@/pages/CustomerDetailPage'
import { PayoutsPage } from '@/pages/PayoutsPage'
import { RidersPage } from '@/pages/RidersPage'

export const router = createBrowserRouter([
  // Public storefront — anyone can browse; buy actions gate themselves.
  {
    element: <StorefrontLayout />,
    children: [
      { index: true, element: <CatalogPage /> },
      { path: 'products/:productId', element: <ProductDetailPage /> },
      { path: 'account', element: <StorefrontAuthPage /> },
      { path: 'cart', element: <CartPage /> },
      // Sign-in required: checkout and order history.
      {
        element: <CustomerRoute />,
        children: [
          { path: 'checkout', element: <CheckoutPage /> },
          { path: 'orders', element: <MyOrdersPage /> },
          { path: 'orders/:orderId', element: <OrderDetailPage /> },
        ],
      },
    ],
  },
  // Admin sign-in (rejects non-admins) lives outside the storefront shell.
  { path: '/login', element: <LoginPage /> },
  // Admin console — gated, namespaced under /admin.
  {
    path: 'admin',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'vendors', element: <VendorsPage /> },
          { path: 'orders', element: <OrdersPage /> },
          { path: 'products', element: <AdminProductsPage /> },
          { path: 'categories', element: <CategoriesPage /> },
          { path: 'customers', element: <CustomersPage /> },
          { path: 'customers/:customerId', element: <CustomerDetailPage /> },
          { path: 'payouts', element: <PayoutsPage /> },
          { path: 'riders', element: <RidersPage /> },
          { path: 'banners', element: <BannersPage /> },
          { path: 'brand-stores', element: <BrandStoresPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

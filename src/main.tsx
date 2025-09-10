import React from 'react'
const InvoiceViewLazy = React.lazy(() => import('./pages/InvoiceView'))
import ToastHost from './ui/ToastHost'
const InvoicesLazy = React.lazy(() => import('./pages/Invoices'))
const CustomerDetailLazy = React.lazy(() => import('./pages/CustomerDetail'))
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import SignIn from './pages/SignIn'
import Dashboard from './pages/Dashboard'
import BusinessProfile from './pages/BusinessProfile'
import Customers from './pages/Customers'
import CreateInvoice from './pages/CreateInvoice'
import ItemLibrary from './pages/ItemLibrary'
import Onboarding from './pages/Onboarding'
import ServiceTemplateManager from './pages/ServiceTemplateManager'
import TermsAndConditions from './pages/TermsAndConditions'
import QuickInvoice from './pages/QuickInvoice'
import LandingPage from './pages/LandingPage'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import PlanSelection from './pages/PlanSelection'
import SubscriptionManagement from './pages/SubscriptionManagement'
import { SubscriptionProvider } from './contexts/SubscriptionContext'

const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/app', element: <App />, children: [
      { index: true, element: <Dashboard /> },
      { path: 'business', element: <BusinessProfile /> },
      { path: 'customers', element: <Customers /> },
      { path: 'customer/:id', element: <React.Suspense fallback={null}><CustomerDetailLazy /></React.Suspense> },
      { path: 'create-invoice', element: <CreateInvoice /> },
      { path: 'invoices', element: <React.Suspense fallback={null}><InvoicesLazy /></React.Suspense> },
      { path: 'invoice/:id', element: <React.Suspense fallback={null}><InvoiceViewLazy /></React.Suspense> },
      { path: 'item-library', element: <ItemLibrary /> },
      { path: 'service-templates', element: <ServiceTemplateManager /> },
      { path: 'subscription', element: <SubscriptionManagement /> },
      { path: 'terms', element: <TermsAndConditions /> },
      { path: 'quick-invoice', element: <QuickInvoice /> },
    ]
  },
  { path: '/signin', element: <SignIn /> },
  { path: '/select-plan', element: <PlanSelection /> },
  { path: '/onboarding', element: <Onboarding /> },
  { path: '/landing', element: <LandingPage /> },
  { path: '/admin-login', element: <AdminLogin /> },
  { path: '/admin-dashboard', element: <AdminDashboard /> },
])

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SubscriptionProvider autoRefresh={false}>
      <RouterProvider router={router} />
      <ToastHost />
    </SubscriptionProvider>
  </React.StrictMode>
)

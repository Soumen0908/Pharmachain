import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Web3Provider } from './context/Web3Context';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import AnimatedBackground from './components/AnimatedBackground';
import { PageSkeleton } from './components/SkeletonLoader';
import ProtectedRoute from './components/ProtectedRoute';

const Intro = lazy(() => import('./pages/Intro'));
const Landing = lazy(() => import('./pages/Landing'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Manufacturer = lazy(() => import('./pages/Manufacturer'));
const Transfer = lazy(() => import('./pages/Transfer'));
const Verify = lazy(() => import('./pages/Verify'));
const Inspector = lazy(() => import('./pages/Inspector'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Admin = lazy(() => import('./pages/Admin'));
const Scan = lazy(() => import('./pages/Scan'));
const Rewards = lazy(() => import('./pages/Rewards'));
const CustomerLogin = lazy(() => import('./pages/CustomerLogin'));
const ManufacturerLogin = lazy(() => import('./pages/ManufacturerLogin'));
const Profile = lazy(() => import('./pages/Profile'));
const Features = lazy(() => import('./pages/Features'));
const About = lazy(() => import('./pages/About'));
const CustomerDashboard = lazy(() => import('./pages/CustomerDashboard'));
const MedicineSearch = lazy(() => import('./pages/MedicineSearch'));
const BatchTracker = lazy(() => import('./pages/BatchTracker'));
const SupplyChain = lazy(() => import('./pages/SupplyChain'));
const TransactionHistory = lazy(() => import('./pages/TransactionHistory'));
const NotFound = lazy(() => import('./pages/NotFound'));

function AppLayout() {
    const location = useLocation();
    const isIntro = location.pathname === '/';

    return (
        <>
            {!isIntro && <Navbar />}
            {!isIntro && <AnimatedBackground />}
            <Suspense fallback={<PageSkeleton />}>
                <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Intro />} />
                    <Route path="/home" element={<Landing />} />
                    <Route path="/login/customer" element={<CustomerLogin />} />
                    <Route path="/login/manufacturer" element={<ManufacturerLogin />} />
                    <Route path="/features" element={<Features />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/verify" element={<Verify />} />
                    <Route path="/verify/:batchId" element={<Verify />} />
                    <Route path="/scan" element={
                        <ProtectedRoute allowedRoles={['customer']} redirectTo="/login/customer">
                            <Scan />
                        </ProtectedRoute>
                    } />
                    <Route path="/medicine-search" element={<MedicineSearch />} />
                    <Route path="/batch-tracker" element={<BatchTracker />} />
                    <Route path="/supply-chain" element={<SupplyChain />} />
                    <Route path="/transactions" element={<TransactionHistory />} />

                    {/* Auth-required routes (any role) */}
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/rewards" element={<ProtectedRoute><Rewards /></ProtectedRoute>} />

                    {/* Customer routes */}
                    <Route path="/customer-dashboard" element={
                        <ProtectedRoute allowedRoles={['customer']} redirectTo="/login/customer">
                            <CustomerDashboard />
                        </ProtectedRoute>
                    } />

                    {/* Manufacturer routes */}
                    <Route path="/manufacturer" element={
                        <ProtectedRoute allowedRoles={['manufacturer']} redirectTo="/login/manufacturer">
                            <Manufacturer />
                        </ProtectedRoute>
                    } />
                    <Route path="/transfer" element={
                        <ProtectedRoute allowedRoles={['manufacturer']} redirectTo="/login/manufacturer">
                            <Transfer />
                        </ProtectedRoute>
                    } />

                    {/* Dashboard / Inspector / Analytics / Admin — require wallet connection (on-chain roles) */}
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/inspector" element={<Inspector />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/admin" element={<Admin />} />

                    {/* 404 catch-all */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>
        </>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <ToastProvider>
                <AuthProvider>
                    <Web3Provider>
                        <Router>
                            <ErrorBoundary>
                                <AppLayout />
                            </ErrorBoundary>
                        </Router>
                    </Web3Provider>
                </AuthProvider>
            </ToastProvider>
        </ThemeProvider>
    );
}

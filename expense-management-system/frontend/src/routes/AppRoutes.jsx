import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import Layout from '../components/Layout';
import { ROLES } from '../utils/auth';

// Pages
import Login from '../pages/Login';
import EmployeeDashboard from '../pages/EmployeeDashboard';
import ManagerDashboard from '../pages/ManagerDashboard';
import FinanceDashboard from '../pages/FinanceDashboard';
import DirectorDashboard from '../pages/DirectorDashboard';
import AdminDashboard from '../pages/AdminDashboard';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      {/* Protected Routes using Layout container */}
      <Route element={<Layout />}>
        {/* Employee */}
        <Route element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]} />}>
          <Route path="/employee" element={<EmployeeDashboard />} />
          <Route path="/employee/requests" element={<EmployeeDashboard />} />
        </Route>

        {/* Manager */}
        <Route element={<ProtectedRoute allowedRoles={[ROLES.MANAGER]} />}>
          <Route path="/manager" element={<ManagerDashboard />} />
          <Route path="/manager/approvals" element={<ManagerDashboard />} />
        </Route>

        {/* Finance */}
        <Route element={<ProtectedRoute allowedRoles={[ROLES.FINANCE]} />}>
          <Route path="/finance" element={<FinanceDashboard />} />
          <Route path="/finance/verifications" element={<FinanceDashboard />} />
        </Route>

        {/* Director */}
        <Route element={<ProtectedRoute allowedRoles={[ROLES.DIRECTOR]} />}>
          <Route path="/director" element={<DirectorDashboard />} />
          <Route path="/director/final" element={<DirectorDashboard />} />
        </Route>

        {/* Admin */}
        <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminDashboard />} />
        </Route>
      </Route>
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;

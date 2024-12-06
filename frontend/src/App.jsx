import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Register from './components/Register';
import Calendar from './components/calendar';
import ACDetails from './components/ac';
import Adminpanel from './components/adminpanel';
import ProtectedRoute from './components/ProtectedRoute';
import Maintenancehistory from './components/maintenancehistory';



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/maintenancehistory" element={<Maintenancehistory />} />
        <Route path="/register" element={<Register />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/ac" element={<ACDetails />} />
        <Route path="/adminpanel" element={<ProtectedRoute role="admin" />}>
          <Route path="" element={<Adminpanel />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

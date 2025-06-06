

// client/src/App.jsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// General Page Imports
import Home from "./pages/Home.jsx";
import Profile from "./pages/Profile.jsx";
import SignUp from "./pages/SignUp.jsx";
import SignIn from "./pages/SignIn.jsx";
import About from "./pages/About.jsx";

// Component Imports
import Header from "./components/Header.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import AdminRoute from "./components/AdminRoute.jsx";

// Online Judge Feature Page Imports
import ProblemList from './pages/ProblemList.jsx';
import ProblemDetail from './pages/ProblemDetail.jsx';
import MySubmissions from './pages/MySubmissions.jsx';
import SubmissionResultPage from './pages/SubmissionResultPage.jsx';

// Admin Problem Management Pages
import EditProblemPage from './pages/EditProblemPage.jsx';
import CreateProblemPage from './pages/CreateProblem.jsx'; // Renamed local import for consistency

// Context & Axios Setup
import { AuthProvider } from './context/AuthContext.jsx'; // IMPORTANT: Ensure your file is AuthContext.js
import axios from 'axios';
// axios.defaults.baseURL = 'http://localhost:3000';
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';



function App() {
    return (
        <Router>
            <Header /> 
            {/* IMPORTANT: Wrap your Routes with AuthProvider to make AuthContext available */}
            <AuthProvider> 
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/problems" element={<ProblemList />} />
                    <Route path="/problems/:id" element={<ProblemDetail />} />
                    <Route path="/mysubmissions" element={<MySubmissions />} />
                    <Route path="/submissions/:submissionId" element={<SubmissionResultPage />} />

                    {/* Authentication Routes */}
                    <Route path="/signin" element={<SignIn />} />
                    <Route path="/signup" element={<SignUp />} />

                    {/* Level 1 Protected Routes (Requires ANY login) */}
                    {/* PrivateRoute should check if user is logged in */}
                    <Route element={<PrivateRoute />}>
                        <Route path="/profile" element={<Profile />} />
                    </Route>

                    {/* Level 2 Protected Routes (Requires Admin login) */}
                    {/* AdminRoute should check if user is logged in AND has 'admin' role */}
                    <Route element={<AdminRoute />}>
                        {/* Consolidated problem creation route */}
                        <Route path="/admin/problems/new" element={<CreateProblemPage />} />
                        <Route path="/admin/problems/edit/:id" element={<EditProblemPage />} /> {/* Admin edit route */}
                    </Route>

                    {/* Add a catch-all route for 404 Not Found if desired */}
                    {/* <Route path="*" element={<div>404 Not Found</div>} /> */}
                </Routes>
            </AuthProvider> {/* End AuthProvider */}
        </Router>
    );
}

export default App;



// client/src/App.jsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from "./pages/Home.jsx";
import Profile from "./pages/Profile.jsx";
import SignUp from "./pages/SignUp.jsx";
import SignIn from "./pages/SignIn.jsx";
import About from "./pages/About.jsx";
import Header from "./components/Header.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx"; // Reverted to general private route
import AdminRoute from "./components/AdminRoute.jsx";  
import SubmissionDetail from './pages/SubmissionDetail.jsx';

// Imports for the Online Judge features
import ProblemList from './pages/ProblemList.jsx';
import CreateProblem from './pages/CreateProblem.jsx';
import ProblemDetail from './pages/ProblemDetail.jsx';
import MySubmissions from './pages/MySubmissions.jsx';
import axios from 'axios';
axios.defaults.baseURL = 'http://localhost:3000';


function App() {
    return (
        <Router>
            <Header /> 

            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/problems" element={<ProblemList />} />
                <Route path="/problems/:id" element={<ProblemDetail />} />
                <Route path="/mysubmissions" element={<MySubmissions />} />
                <Route path="/submissions/:id" element={<SubmissionDetail />} />

                {/* Authentication Routes */}
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />

                {/* Level 1 Protected Routes (Requires ANY login) */}
                <Route element={<PrivateRoute />}>
                    <Route path="/profile" element={<Profile />} /> {/* Now accessible by any logged-in user */}
                </Route>

                {/* Level 2 Protected Routes (Requires Admin login) */}
                <Route element={<AdminRoute />}>
                    <Route path="/create-problem" element={<CreateProblem />} /> {/* Only accessible by logged-in admins */}
                </Route>

                {/* Add a catch-all route for 404 Not Found if desired */}
                {/* <Route path="*" element={<div>404 Not Found</div>} /> */}
            </Routes>
        </Router>
    );
}

export default App;
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'; // Renamed BrowserRouter to Router for consistency with your new code
import Home from "./pages/Home.jsx";
import Profile from "./pages/Profile.jsx";
import SignUp from "./pages/SignUp.jsx"; // Renamed to SignUp for consistency with your new code (was Register in the new snippet)
import SignIn from "./pages/SignIn.jsx"; // Renamed to SignIn for consistency with your new code (was Login in the new snippet)
import About from "./pages/About.jsx";
import Header from "./components/Header.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";

// Imports for the Online Judge features
import ProblemList from './pages/ProblemList.jsx';
import CreateProblem from './pages/CreateProblem.jsx';
import ProblemDetail from './pages/ProblemDetail.jsx'; // We'll create this in a later part

function App() {
    return (
        <Router>
            <Header /> {/* Your existing header */}
            <nav style={{ padding: '10px', backgroundColor: '#f0f0f0', borderBottom: '1px solid #ddd' }}> {/* Added a subtle border */}
                <Link to="/" style={{ margin: '0 10px', textDecoration: 'none', color: '#333' }}>Home</Link>
                <Link to="/problems" style={{ margin: '0 10px', textDecoration: 'none', color: '#333' }}>Problems</Link>
                <Link to="/signin" style={{ margin: '0 10px', textDecoration: 'none', color: '#333' }}>Login</Link> {/* Changed to /signin */}
                <Link to="/signup" style={{ margin: '0 10px', textDecoration: 'none', color: '#333' }}>Register</Link> {/* Changed to /signup */}
                <Link to="/profile" style={{ margin: '0 10px', textDecoration: 'none', color: '#333' }}>Profile</Link>
                <Link to="/about" style={{ margin: '0 10px', textDecoration: 'none', color: '#333' }}>About</Link>
                {/* Only show if user is admin - you'll likely manage this with context/state/auth */}
                <Link to="/admin/create-problem" style={{ margin: '0 10px', textDecoration: 'none', color: '#333' }}>Create Problem</Link>
            </nav>
            <Routes>
                {/* Existing Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/signin" element={<SignIn />} /> {/* Matched to your existing component */}
                <Route path="/signup" element={<SignUp />} /> {/* Matched to your existing component */}
                <Route path="/about" element={<About />} />

                {/* Private Routes for user-specific features */}
                <Route element={<PrivateRoute />}>
                    <Route path="/profile" element={<Profile />} />
                    {/* Add any other routes that should be protected by PrivateRoute here */}
                </Route>

                {/* Online Judge Specific Routes */}
                <Route path="/problems" element={<ProblemList />} />
                <Route path="/admin/create-problem" element={<CreateProblem />} />
                <Route path="/problems/:id" element={<ProblemDetail />} /> {/* Route for viewing individual problems */}
            </Routes>
        </Router>
    );
}

export default App;
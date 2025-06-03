// home.jsx
import React from 'react';
import { Link } from 'react-router-dom'; // Assuming you're using react-router-dom
import './Home.css'; // Import the CSS file for this component

const Home = () => {
    return (
        
            

            <main className="home-main">
                <section className="home-hero">
                    <div className="home-container">
                        <h2>Welcome to algoQuest</h2>
                        {/* Problem List Button in Hero Section */}
                        <Link to="/problems" className="home-btn home-btn-primary">Browse Problems</Link>
                    </div>
                    
      
                </section>
                

               
                        

            </main>

            
        
    );
};

export default Home;
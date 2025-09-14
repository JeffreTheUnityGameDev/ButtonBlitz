import Layout from "./Layout.jsx";

import Home from "./Home";

import LocalGame from "./LocalGame";

import OnlineLobby from "./OnlineLobby";

import OnlineGame from "./OnlineGame";

import Settings from "./Settings";

import PrivacyPolicy from "./PrivacyPolicy";

import TermsOfService from "./TermsOfService";

import HomePage from "./HomePage";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Home: Home,
    
    LocalGame: LocalGame,
    
    OnlineLobby: OnlineLobby,
    
    OnlineGame: OnlineGame,
    
    Settings: Settings,
    
    PrivacyPolicy: PrivacyPolicy,
    
    TermsOfService: TermsOfService,
    
    HomePage: HomePage,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Home />} />
                
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/LocalGame" element={<LocalGame />} />
                
                <Route path="/OnlineLobby" element={<OnlineLobby />} />
                
                <Route path="/OnlineGame" element={<OnlineGame />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
                
                <Route path="/TermsOfService" element={<TermsOfService />} />
                
                <Route path="/HomePage" element={<HomePage />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}
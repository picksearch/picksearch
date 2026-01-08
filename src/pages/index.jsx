import Layout from "./Layout.jsx";

import Login from "./Login";
import Signup from "./Signup";
import AuthCallback from "./AuthCallback";
import ForgotPassword from "./ForgotPassword";

import AIQuestionGenerator from "./AIQuestionGenerator";

import APIGuide from "./APIGuide";

import AdminDashboard from "./AdminDashboard";

import AdminSettings from "./AdminSettings";

import ClientHome from "./ClientHome";

import CreateFreeSurvey from "./CreateFreeSurvey";

import CreateSurvey from "./CreateSurvey";

import FreeSurveyResults from "./FreeSurveyResults";

import Guide from "./Guide";

import Home from "./Home";

import LandingPage from "./LandingPage";

import MyPage from "./MyPage";

import MySurveys from "./MySurveys";

import OrderManagement from "./OrderManagement";

import PaymentConfirmation from "./PaymentConfirmation";

import PaymentPage from "./PaymentPage";

import PicketingIntegration from "./PicketingIntegration";

import PrivacyPolicy from "./PrivacyPolicy";

import Support from "./Support";

import SurveyDetail from "./SurveyDetail";

import SurveyResults from "./SurveyResults";

import TakeSurvey from "./TakeSurvey";

import TargetSettings from "./TargetSettings";

import TermsOfService from "./TermsOfService";

import UseCases from "./UseCases";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    AIQuestionGenerator: AIQuestionGenerator,
    
    APIGuide: APIGuide,
    
    AdminDashboard: AdminDashboard,
    
    AdminSettings: AdminSettings,
    
    ClientHome: ClientHome,

    CreateFreeSurvey: CreateFreeSurvey,

    CreateSurvey: CreateSurvey,

    FreeSurveyResults: FreeSurveyResults,

    Guide: Guide,
    
    Home: Home,
    
    LandingPage: LandingPage,
    
    MyPage: MyPage,
    
    MySurveys: MySurveys,
    
    OrderManagement: OrderManagement,
    
    PaymentConfirmation: PaymentConfirmation,
    
    PaymentPage: PaymentPage,
    
    PicketingIntegration: PicketingIntegration,
    
    PrivacyPolicy: PrivacyPolicy,
    
    Support: Support,
    
    SurveyDetail: SurveyDetail,
    
    SurveyResults: SurveyResults,
    
    TakeSurvey: TakeSurvey,
    
    TargetSettings: TargetSettings,
    
    TermsOfService: TermsOfService,
    
    UseCases: UseCases,
    
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
        <Routes>
            {/* Auth pages without Layout */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Main app with Layout */}
            <Route path="/*" element={
                <Layout currentPageName={currentPage}>
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                
                
                <Route path="/AIQuestionGenerator" element={<AIQuestionGenerator />} />
                
                <Route path="/APIGuide" element={<APIGuide />} />
                
                <Route path="/AdminDashboard" element={<AdminDashboard />} />
                
                <Route path="/AdminSettings" element={<AdminSettings />} />
                
                <Route path="/ClientHome" element={<ClientHome />} />

                <Route path="/CreateFreeSurvey" element={<CreateFreeSurvey />} />

                <Route path="/CreateSurvey" element={<CreateSurvey />} />

                <Route path="/FreeSurveyResults" element={<FreeSurveyResults />} />

                <Route path="/Guide" element={<Guide />} />
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/LandingPage" element={<LandingPage />} />
                
                <Route path="/MyPage" element={<MyPage />} />
                
                <Route path="/MySurveys" element={<MySurveys />} />
                
                <Route path="/OrderManagement" element={<OrderManagement />} />
                
                <Route path="/PaymentConfirmation" element={<PaymentConfirmation />} />
                
                <Route path="/PaymentPage" element={<PaymentPage />} />
                
                <Route path="/PicketingIntegration" element={<PicketingIntegration />} />
                
                <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />

                <Route path="/privacy" element={<PrivacyPolicy />} />
                
                <Route path="/Support" element={<Support />} />
                
                <Route path="/SurveyDetail" element={<SurveyDetail />} />
                
                <Route path="/SurveyResults" element={<SurveyResults />} />
                
                <Route path="/TakeSurvey" element={<TakeSurvey />} />
                
                <Route path="/TargetSettings" element={<TargetSettings />} />
                
                <Route path="/TermsOfService" element={<TermsOfService />} />

                <Route path="/terms" element={<TermsOfService />} />
                
                <Route path="/UseCases" element={<UseCases />} />
                    </Routes>
                </Layout>
            } />
        </Routes>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}
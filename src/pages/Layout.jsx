
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, PlusCircle, Coins, Shield, Settings, Sparkles, BarChart3, User, Megaphone, HelpCircle } from "lucide-react";
import { auth } from "@/api/auth";
import { SEOSetting } from "@/api/entities";
import { useQuery } from "@tanstack/react-query";
import InAppBrowserCheck from "@/components/InAppBrowserCheck";
import ReferralHandler from "@/components/referral/ReferralHandler";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  // Google Tag Manager & Global Head Settings
  React.useEffect(() => {
    // Default Title
    document.title = '픽서치-PICKSEARCH';

    // Favicon Update
    let link = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690ca08f00a852116a9c9752/541bf4ce9_Logo1.png';
    link.type = 'image/png';

    // Open Graph 기본 태그 설정 (카카오톡 링크 미리보기)
    const setMetaTag = (property, content) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    setMetaTag('og:title', '픽서치-초정밀 타겟 데이터 수집 플랫폼');
    setMetaTag('og:description', '1.3억 SKP기반 ID로 데이터를 수집해드려요');
    setMetaTag('og:image', 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690ca08f00a852116a9c9752/541bf4ce9_Logo1.png');
    setMetaTag('og:url', 'https://picksearch.ai');
    setMetaTag('og:type', 'website');
    setMetaTag('og:site_name', '픽서치');

    // GTM Script Injection
    const gtmId = 'GTM-59TZGSPT';
    if (!document.getElementById('gtm-script')) {
      const script = document.createElement('script');
      script.id = 'gtm-script';
      script.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${gtmId}');`;
      
      // head의 맨 처음에 삽입 (권장사항)
      if (document.head.firstChild) {
        document.head.insertBefore(script, document.head.firstChild);
      } else {
        document.head.appendChild(script);
      }

      // GTM Noscript Injection (Body Start)
      const noscript = document.createElement('noscript');
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.googletagmanager.com/ns.html?id=${gtmId}`;
      iframe.height = "0";
      iframe.width = "0";
      iframe.style.display = "none";
      iframe.style.visibility = "hidden";
      noscript.appendChild(iframe);
      
      // body의 맨 처음에 삽입 (권장사항)
      if (document.body.firstChild) {
        document.body.insertBefore(noscript, document.body.firstChild);
      } else {
        document.body.appendChild(noscript);
      }
    }
  }, []);

  // 페이지 이동 시 스크롤 최상단으로 이동
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // SEO Settings Application
  const { data: seoSettings = [] } = useQuery({
    queryKey: ['seoSettings'],
    queryFn: async () => {
      try {
        return await SEOSetting.getAll();
      } catch (e) {
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  React.useEffect(() => {
    const currentPath = location.pathname;
    // Find exact match or match without trailing slash if not root
    const setting = seoSettings.find(s => 
      s.page_path === currentPath || 
      (currentPath.length > 1 && s.page_path === currentPath.replace(/\/$/, ''))
    );

    if (setting) {
      if (setting.title) document.title = setting.title;
      
      // Helper to set meta tag
      const setMeta = (name, content) => {
        let element = document.querySelector(`meta[name="${name}"]`);
        if (!element) {
          element = document.createElement('meta');
          element.setAttribute('name', name);
          document.head.appendChild(element);
        }
        element.setAttribute('content', content || '');
      };

      // Helper to set property tag (OG)
      const setProperty = (property, content) => {
        let element = document.querySelector(`meta[property="${property}"]`);
        if (!element) {
          element = document.createElement('meta');
          element.setAttribute('property', property);
          document.head.appendChild(element);
        }
        element.setAttribute('content', content || '');
      };

      if (setting.meta_description) {
        setMeta('description', setting.meta_description);
        setProperty('og:description', setting.meta_description);
      }
      
      if (setting.meta_keywords) {
        setMeta('keywords', setting.meta_keywords);
      }

      if (setting.og_image) {
        setProperty('og:image', setting.og_image);
      }
      
      if (setting.title) {
        setProperty('og:title', setting.title);
      }
    }
  }, [location.pathname, seoSettings]);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await auth.me();
      } catch (error) {
        return null;
      }
    },
  });

  const isAdmin = user?.role === 'admin';
  
  const isTakeSurveyPage = currentPageName === 'TakeSurvey' || 
                           location.pathname.includes('TakeSurvey') ||
                           location.search.includes('key=');
  
  const isCreateSurveyPage = currentPageName === 'CreateSurvey' ||
                             location.pathname === createPageUrl('CreateSurvey');

  const isCreateFreeSurveyPage = currentPageName === 'CreateFreeSurvey' ||
                                 location.pathname === createPageUrl('CreateFreeSurvey');
  
  const isAIGeneratorPage = currentPageName === 'AIQuestionGenerator' ||
                            location.pathname === createPageUrl('AIQuestionGenerator');
  
  const isTargetSettingsPage = currentPageName === 'TargetSettings' || 
                               location.pathname === createPageUrl('TargetSettings');

  const isAdminSettingsPage = currentPageName === 'AdminSettings' || 
                              location.pathname.toLowerCase().includes('adminsettings');

  const isGuidePage = currentPageName === 'Guide' || location.pathname.toLowerCase().includes('guide');
  const isUseCasesPage = currentPageName === 'UseCases' || location.pathname.toLowerCase().includes('usecases');
  const isLandingPage = currentPageName === 'LandingPage' || location.pathname === createPageUrl('LandingPage');

  // TakeSurvey, TargetSettings, AdminSettings, Guide, UseCases, LandingPage 페이지는 별도 레이아웃 사용 (또는 레이아웃 없음)
  if (isTakeSurveyPage || isTargetSettingsPage || isAdminSettingsPage || isGuidePage || isUseCasesPage || isLandingPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#F2F4F6] pb-20">
      <InAppBrowserCheck />
        <ReferralHandler />
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
        
        * {
          font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
        }

        :root {
          --primary-blue: #3182F6;
          --secondary-blue: #4294FF;
          --bg-color: #F2F4F6;
        }
      `}</style>

      {/* Header - Removed as requested by user */}
      {/* {!isCreateSurveyPage && !isAIGeneratorPage && (
        <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-50">
          ... removed content ...
        </header>
      )} */}

      {/* Main Content */}
      <main className={`max-w-md mx-auto px-4 ${isCreateSurveyPage || isAIGeneratorPage || isCreateFreeSurveyPage ? 'pt-4 pb-4' : 'py-6'}`}>
        {children}
      </main>

      {/* Bottom Navigation - 메인 탭 페이지에서만 표시 (CreateSurvey 등 제외) */}
      {!isCreateSurveyPage && !isAIGeneratorPage && !isCreateFreeSurveyPage && (user || currentPageName === 'Support' || currentPageName === 'ClientHome' || currentPageName === 'LandingPage') && ['ClientHome', 'MySurveys', 'SurveyResults', 'CreditManagement', 'Support', 'MyPage', 'OrderManagement', 'LandingPage'].includes(currentPageName) && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 z-50 pb-safe">
          <div className="max-w-md mx-auto px-4 py-2">
            <div className="flex justify-around items-center">
              <Link 
                to={createPageUrl("LandingPage")}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                  location.pathname === createPageUrl("LandingPage")
                    ? 'text-[#333D4B]'
                    : 'text-[#B0B8C1]'
                }`}
              >
                <Sparkles className="w-6 h-6" />
                <span className="text-[10px] font-medium">소개</span>
              </Link>

              <Link 
                to={createPageUrl("ClientHome")}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                  location.pathname === createPageUrl("ClientHome")
                    ? 'text-[#333D4B]'
                    : 'text-[#B0B8C1]'
                }`}
              >
                <Home className="w-6 h-6" />
                <span className="text-[10px] font-medium">홈</span>
              </Link>

              {user && (
                <Link 
                  to={createPageUrl("MySurveys")}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                    location.pathname === createPageUrl("MySurveys")
                      ? 'text-[#333D4B]'
                      : 'text-[#B0B8C1]'
                  }`}
                >
                  <BarChart3 className="w-6 h-6" />
                  <span className="text-[10px] font-medium">내설문</span>
                </Link>
              )}

              <Link 
                to={createPageUrl("CreateSurvey")}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                  location.pathname === createPageUrl("CreateSurvey")
                    ? 'text-[#333D4B]'
                    : 'text-[#B0B8C1]'
                }`}
              >
                <PlusCircle className="w-6 h-6" />
                <span className="text-[10px] font-medium">만들기</span>
              </Link>



              <Link 
                to={createPageUrl("Support")}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                  location.pathname === createPageUrl("Support")
                    ? 'text-[#333D4B]'
                    : 'text-[#B0B8C1]'
                }`}
              >
                <HelpCircle className="w-6 h-6" />
                <span className="text-[10px] font-medium">문의</span>
              </Link>

              {user && (
                <Link 
                  to={createPageUrl("MyPage")}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                    location.pathname === createPageUrl("MyPage")
                      ? 'text-[#333D4B]'
                      : 'text-[#B0B8C1]'
                  }`}
                >
                  <User className="w-6 h-6" />
                  <span className="text-[10px] font-medium">마이</span>
                </Link>
              )}

              {isAdmin && (
                <>
                  <Link 
                    to={createPageUrl("OrderManagement")}
                    className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all ${
                      location.pathname === createPageUrl("OrderManagement")
                        ? 'text-[#333D4B]'
                        : 'text-[#B0B8C1]'
                    }`}
                  >
                    <Shield className="w-6 h-6" />
                    <span className="text-[10px] font-medium">주문</span>
                  </Link>
                  <button 
                    onClick={() => window.open(createPageUrl("AdminSettings"), '_blank')}
                    className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all text-[#B0B8C1] hover:text-[#333D4B]"
                  >
                    <Settings className="w-6 h-6" />
                    <span className="text-[10px] font-medium">관리</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}

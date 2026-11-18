import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Context from '@/context/Context';
import QueryProvider from '@/components/providers/query-provider';
import CartModal from '@/components/modals/CartModal';
import QuickView from '@/components/modals/QuickView';
import QuickAdd from '@/components/modals/QuickAdd';
import Compare from '@/components/modals/Compare';
import MobileMenu from '@/components/modals/MobileMenu';
import SearchModal from '@/components/modals/SearchModal';
import SizeGuide from '@/components/modals/SizeGuide';
import Wishlist from '@/components/modals/Wishlist';
import DemoModal from '@/components/modals/DemoModal';
import Categories from '@/components/modals/Categories';
import AccountSidebar from '@/components/modals/AccountSidebar';
import FloatingWhatsApp from '@/components/common/FloatingWhatsApp';
import { Toaster } from 'react-hot-toast';
import { useLocale } from '@/i18n/provider';
import '@/styles/search-modal.css';

function RouteEffects() {
  const location = useLocation();
  const locale = useLocale();
  const pathname = location.pathname + location.search + location.hash;
  const [scrollDirection, setScrollDirection] = useState('down');

  useEffect(() => {
    import('bootstrap/dist/js/bootstrap.esm').catch(() => {});
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    document.body.className = `preload-wrapper popup-loader ${locale === 'ar' ? 'rtl' : ''}`.trim();
  }, [locale]);

  useEffect(() => {
    const handleScroll = () => {
      const header = document.querySelector('header');
      if (!header) return;
      if (window.scrollY > 100) header.classList.add('header-bg');
      else header.classList.remove('header-bg');
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setScrollDirection('up');
    const lastScrollY = { current: window.scrollY };
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 250) {
        setScrollDirection(currentScrollY > lastScrollY.current ? 'down' : 'up');
      } else {
        setScrollDirection('down');
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  useEffect(() => {
    import('bootstrap').then((bootstrap) => {
      const modalElements = document.querySelectorAll('.modal.show');
      modalElements.forEach((modal) => {
        const instance = bootstrap.Modal.getInstance(modal);
        if (instance) instance.hide();
      });
      const offcanvasElements = document.querySelectorAll('.offcanvas.show');
      offcanvasElements.forEach((canvas) => {
        const instance = bootstrap.Offcanvas.getInstance(canvas);
        if (instance) instance.hide();
      });
    }).catch(() => {});
  }, [pathname]);

  useEffect(() => {
    const header = document.querySelector('header');
    if (!header) return;
    header.style.top = scrollDirection === 'up' ? '0px' : '-185px';
  }, [scrollDirection]);

  useEffect(() => {
    import('@/utlis/wow').then((WOW) => {
      const wow = new WOW.default({ mobile: false, live: false });
      wow.init();
    }).catch(() => {});
  }, [pathname]);

  return null;
}

export default function AppShell({ children }) {
  return (
    <QueryProvider>
      <Context>
        <RouteEffects />
        <main>
          <div id="wrapper">{children}</div>
          <CartModal />
          <QuickView />
          <QuickAdd />
          <Compare />
          <MobileMenu />
          <Toaster />
          <SearchModal />
          <SizeGuide />
          <Wishlist />
          <DemoModal />
          <Categories />
          <AccountSidebar />
          <FloatingWhatsApp />
        </main>
      </Context>
    </QueryProvider>
  );
}

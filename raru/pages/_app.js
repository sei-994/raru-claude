
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import '../styles/globals.css';
import '../styles/add.css';

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    document.body.classList.remove('home-page', 'sub-page');
    if (router.pathname === '/') {
      document.body.classList.add('home-page');
    } else {
      document.body.classList.add('sub-page');
    }
  }, [router.pathname]);

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;

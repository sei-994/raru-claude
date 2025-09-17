import { useRouter } from 'next/router';
import Head from 'next/head';
import articles from '../../data/articles.json';

const ArticleDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  const article = articles.articles.find(a => a.id === parseInt(id));

  if (!article) {
    return <p>記事が見つかりません。</p>;
  }

  return (
    <>
      <Head>
        <title>{article.title} | raru</title>
        <meta name="description" content={article.content} />
      </Head>
      <div className="sju-page about-page">
        <div className="sju-page-inner">
          <div className="sju-page-container">
            <div className="sju-aside-layout">
              <div className="sju-aside-layout-main">
                <section className="sju-section">
                  <header className="sju-section-header">
                    <h2 className="sju-section-title">{article.title}</h2>
                  </header>
                  <main className="sju-section-main">
                    <div className="post-content">
                      <p>{article.content}</p>
                      <p>公開日: {article.date}</p>
                    </div>
                  </main>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ArticleDetail;
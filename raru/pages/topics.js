import Head from 'next/head';
import Link from 'next/link';
import articles from '../data/articles.json';

const Topics = () => {
  return (
    <>
      <Head>
        <title>topics | raru</title>
        <meta name="description" content="topicsの一覧ページです。raru所属タレントの情報を発信します。" />
        <link rel="canonical" href="https://raru.tokyo/topics/" />
      </Head>
      <div className="sju-page about-page">
        
      
          <div className="sju-page-container">
            <div className="sju-aside-layout">
              <div className="sju-aside-layout-main">
                <section className="sju-section">
                  <header className="sju-section-header">
                    <h2 className="sju-section-title">topics</h2>
                  </header>
                  <main className="sju-section-main">
                    <ul className="topics-card-list col-3">
                      {articles.articles.map((article) => (
                        <li key={article.id}>
                          <Link href={`/media/${article.id}`} className="topics-card">
                            <article className="topics-card-inner">
                              <div className="topics-card-thumbnail">
                                <div className="topics-card-thumbnail-inner">
                                  <span className="topics-card-thumbnail-caption">{article.date}</span>
                                  <div style={{ backgroundImage: `url('/images/news_placeholder.jpg')` }} className="topics-card-thumbnail-container"></div>
                                </div>
                              </div>
                              <div className="topics-card-body">
                                <dl className="topics-card-def">
                                  <dt>
                                    <span className="topics-card-text">
                                      {/* タレント名がないので仮で表示 */}
                                      タレント名
                                    </span>
                                  </dt>
                                  <dd><span className="topics-card-text row-2">{article.title}</span></dd>
                                </dl>
                              </div>
                            </article>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <div className="sju-pagination">
                      <nav className="navigation pagination" aria-label=" ">
                        <h2 className="screen-reader-text"> </h2>
                        <div className="nav-links"><span aria-current="page" className="page-numbers current">1</span>
                          <a className="page-numbers" href="#">2</a>
                          <a className="page-numbers" href="#">3</a>
                          <span className="page-numbers dots">…</span>
                          <a className="page-numbers" href="#">40</a>
                          <a className="next page-numbers" href="#">&gt;</a></div>
                      </nav>
                    </div>
                  </main>
                </section>
              </div>
              
            </div>
          </div>
      </div>
    </>
  );
};

export default Topics;

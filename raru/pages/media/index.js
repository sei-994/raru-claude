import Link from 'next/link';
import articlesData from '../../data/articles.json';

const Media = () => (
  <div className="sju-page-inner">
    <div className="sju-page-container">
      <section className="sju-section">
        <header className="sju-section-header">
          <h2 className="sju-section-title">topics</h2>
        </header>
        <main className="sju-section-main">
          <ul className="topics-card-list">
            {articlesData.articles.map(article => (
              <li key={article.id}>
                <Link href={`/media/${article.id}`} legacyBehavior>
                  <a className="topics-card">
                    <article className="topics-card-inner">
                      <div className="topics-card-thumbnail">
                        <div className="topics-card-thumbnail-inner">
                          <span className="topics-card-thumbnail-caption">{article.date}</span>
                          <div style={{ backgroundImage: "url('/images/news_placeholder.jpg')" }} className="topics-card-thumbnail-container"></div>
                        </div>
                      </div>
                      <div className="topics-card-body">
                        <dl className="topics-card-def">
                          <dt>
                            <span className="topics-card-text">
                              {/* カテゴリがないため空 */}
                            </span>
                          </dt>
                          <dd><span className="topics-card-text row-2">{article.title}</span></dd>
                        </dl>
                      </div>
                    </article>
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </main>
      </section>
    </div>
  </div>
);

export default Media;

import Head from 'next/head';
import Link from 'next/link';
import talents from '../data/talents.json';

const Talents = () => {
  return (
    <>
      <Head>
        <title>talent | raru</title>
        <meta name="description" content="raru所属タレントの一覧ページです。" />
        <link rel="canonical" href="https://raru.tokyo/talents/" />
      </Head>
      <div class="sju-page about-page">
        <div className="sju-page-inner">
          <div className="sju-page-container">
            <div className="sju-aside-layout">
              <div className="sju-aside-layout-main">
                <section className="sju-section">
                  <header className="sju-section-header">
                    <h2 className="sju-section-title">talent</h2>
                  </header>
                  <main className="sju-section-main">
                    <ul className="talent-card-list col-3">
                      {talents.talents.map((talent) => (
                        <li key={talent.id}>
                          <Link href={`/talents/${talent.slug}`} className="talent-card">
                            <article className="talent-card-inner">
                              <div className="talent-card-thumbnail">
                                <div className="talent-card-thumbnail-inner" style={{ backgroundImage: `url('${talent.image}')` }}>
                                  <span className="talent-card-thumbnail-caption">
                                    <dl>
                                      <dt>{talent.name_en}</dt>
                                      <dd>{talent.name_ja}</dd>
                                    </dl>
                                  </span>
                                </div>
                              </div>
                            </article>
                          </Link>
                        </li>
                      ))}
                    </ul>
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

export default Talents;
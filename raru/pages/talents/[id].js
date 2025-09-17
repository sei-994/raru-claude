import { useRouter } from 'next/router';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import talents from '../../data/talents.json';

const TalentDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  const talent = talents.talents.find(t => t.slug === id);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (talent && talent.mv_images && talent.mv_images.length > 1) {
      const interval = setInterval(() => {
        setActiveImageIndex(prevIndex => (prevIndex + 1) % talent.mv_images.length);
      }, 3000); // 3秒ごとに画像を切り替え
      return () => clearInterval(interval);
    }
  }, [talent]);

  if (!talent) {
    return <p>タレントが見つかりません。</p>;
  }

  return (
    <>
      <Head>
        <title>{talent.name} | raru</title>
        <meta name="description" content={talent.profile} />
      </Head>
      <div className="sju-page talents-detail-page">
        <header className="talents-detail-mv jsc-mv">
          <div className="talents-detail-mv-inner">
            <strong className="talents-detail-mv-caption">{talent.name}</strong>
            <ul className="talents-detail-mv-list jsc-mv-list">
              {talent.mv_images && talent.mv_images.map((image, index) => (
                <li key={index} className={index === activeImageIndex ? 'is-active' : ''}>
                  <figure>
                    <img src={image} alt={`${talent.name}の画像${index + 1}枚目`} />
                  </figure>
                </li>
              ))}
            </ul>
            <a href={`/contact?talent=${talent.name}`} target="_blank" className="talents-detail-mv-contact">
              <span>お仕事のご依頼はこちら</span>
            </a>
          </div>
          <div className="talents-detail-mv-control jsc-mv-control">
            {talent.mv_images && talent.mv_images.map((_, index) => (
              <a key={index} href="#" className={`talents-detail-mv-control-item jsc-mv-control-item ${index === activeImageIndex ? 'is-active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveImageIndex(index); }}></a>
            ))}
          </div>
        </header>
        <div className="talents-detail-content">
          <main className="talents-detail-main">
            <section className="talents-detail-info">
              <div className="talents-detail-info-left">
                <figure className="talents-detail-main-thumbnail">
                  <div className="talents-detail-main-thumbnail-body" style={{ backgroundImage: `url('${talent.image}')` }}></div>
                </figure>
              </div>
              <div className="talents-detail-info-right">
                <div className="talents-detail-profile-block">
                  <dl className="talents-detail-profile">
                    <dt>profile</dt>
                    <dd>
                      <dl className="talents-detail-profile-item">
                        <dt>名前</dt>
                        <dd>{talent.name_ja}</dd>
                      </dl>
                    </dd>
                    <dd>
                      <dl className="talents-detail-profile-item">
                        <dt>生年月日</dt>
                        <dd>{talent.birthdate}</dd>
                      </dl>
                    </dd>
                    <dd>
                      <dl className="talents-detail-profile-item">
                        <dt>出身地</dt>
                        <dd>{talent.birthplace}</dd>
                      </dl>
                    </dd>
                    <dd>
                      <dl className="talents-detail-profile-item">
                        <dt>身長</dt>
                        <dd>{talent.height}</dd>
                      </dl>
                    </dd>
                    <dd>
                      <dl className="talents-detail-profile-item">
                        <dt>趣味</dt>
                        <dd>{talent.hobby}</dd>
                      </dl>
                    </dd>
                    <dd>
                      <dl className="talents-detail-profile-item">
                        <dt>特技</dt>
                        <dd>{talent.skill}</dd>
                      </dl>
                    </dd>
                  </dl>
                  <div className="talents-detail-profile-block-right">
                    <figure className="talents-detail-main-thumbnail">
                      <div className="talents-detail-main-thumbnail-body" style={{ backgroundImage: `url('${talent.image}')` }}></div>
                    </figure>
                  </div>
                </div>
                <div className="talents-detail-profile-block">
                  <ul className="talents-detail-sns-list">
                    {talent.instagram && (
                      <li>
                        <a href={talent.instagram} target="_blank" rel="noopener noreferrer" className="talents-detail-sns-link">
                          <img src="/images/instagram.svg" alt="Instagram" />
                        </a>
                      </li>
                    )}
                    {talent.tiktok && (
                      <li>
                        <a href={talent.tiktok} target="_blank" rel="noopener noreferrer" className="talents-detail-sns-link">
                          <img src="/images/tiktok.svg" alt="TikTok" />
                        </a>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </section>
            <section className="talents-detail-section talents-detail-history">
              <header className="talents-detail-section-header">
                <h2 className="talents-detail-section-title">history</h2>
              </header>
              <main className="talents-detail-section-main">
                {talent.history && talent.history.map((item, index) => (
                  <dl key={index} className="talents-detail-aside-item">
                    <dt>{item.year}</dt>
                    <dd>{item.event}</dd>
                  </dl>
                ))}
              </main>
            </section>
          </main>
          <aside className="talents-detail-aside">
            <dl className="talents-detail-profile">
              <dt>history</dt>
              <dd>
                {talent.history && talent.history.map((item, index) => (
                  <dl key={index} className="talents-detail-aside-item">
                    <dt>{item.year}</dt>
                    <dd>{item.event}</dd>
                  </dl>
                ))}
              </dd>
            </dl>
          </aside>
        </div>
      </div>
    </>
  );
};

export default TalentDetail;

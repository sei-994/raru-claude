import { useState, useEffect } from 'react';
import Head from 'next/head';
import talentsData from '../data/talents.json';

const Contact = () => {
  const [formData, setFormData] = useState({
    type: 'プロモーション',
    talent: '',
    lastName: '',
    firstName: '',
    company: '',
    email: '',
    phone: '',
    url: '',
    message: '',
  });
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const talentNames = ['ALL', ...talentsData.talents.map(t => t.name)];

  useEffect(() => {
    // script.jsの内容はNext.jsのフォーム処理と競合する可能性があるため削除またはコメントアウト
    // if (typeof window !== 'undefined' && window.RARU && window.RARU.SHARED && window.RARU.SHARED.CONTACT_CONTROL) {
    //   window.RARU.SHARED.CONTACT_CONTROL.init();
    // }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatusMessage('お問い合わせが正常に送信されました。');
        setFormData({
          type: 'プロモーション',
          talent: '',
          lastName: '',
          firstName: '',
          company: '',
          email: '',
          phone: '',
          url: '',
          message: '',
        });
      } else {
        const errorData = await response.json();
        setStatusMessage(`送信に失敗しました: ${errorData.error || '不明なエラー'}`);
      }
    } catch (error) {
      console.error('フォーム送信エラー:', error);
      setStatusMessage('送信中にエラーが発生しました。ネットワーク接続を確認してください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>contact | raru - GROVE株式会社</title>
        <meta name="description" content="SNSプロモーションのご依頼や、メディア取材/出演、イベント出演、所属希望などに関するお問い合わせはこちら。" />
        <link rel="canonical" href="https://raru.tokyo/contact/" />
      </Head>
      <div id="jsi-contact" className="sju-page contact contact-page">
        <div className="sju-page-inner">
          <div className="sju-page-container">
            <header className="sju-page-header">
              <h1 className="sju-page-title">
                contact
              </h1>
            </header>
            <div className="sju-page-main">
              <p className="sju-page-lead">
                ※は必須項目です
              </p>
              <div className="wpcf7 js" id="wpcf7-f6-o1" lang="ja" dir="ltr">
                <form onSubmit={handleSubmit} className="wpcf7-form init" aria-label="コンタクトフォーム" noValidate="noValidate">
                  <dl className="sju-field cut-top required">
                    <dt>
                      <p>お問い合わせ種別</p>
                    </dt>
                    <dd>
                      <div class="sju-single-select">
                        <select name="type" value={formData.type} onChange={handleChange}>
                          <option value="プロモーション">プロモーション</option>
                          <option value="メディア取材/出演">メディア取材/出演</option>
                          <option value="イベント出演">イベント出演</option>
                          <option value="その他">その他</option>
                        </select>
                      </div>
                    </dd>
                  </dl>
                  <dl className="sju-field required">
                    <dt>
                      <p>希望タレント</p>
                    </dt>
                    <dd>
                      <div className="sju-single-select">
                        <select name="talent" value={formData.talent} onChange={handleChange}>
                          <option value="">選択してください</option>
                          {talentNames.map((name, index) => (
                            <option key={index} value={name}>{name}</option>
                          ))}
                        </select>
                      </div>
                    </dd>
                  </dl>
                  <dl className="sju-field required">
                    <dt>
                      <p>お名前</p>
                    </dt>
                    <dd>
                      <div className="sju-field-pair">
                        <span className="wpcf7-form-control-wrap" data-name="lastName">
                          <input size="40" className="wpcf7-form-control wpcf7-text wpcf7-validates-as-required" aria-required="true" aria-invalid="false" placeholder="姓" type="text" name="lastName" value={formData.lastName} onChange={handleChange} required />
                        </span>
                        <span className="wpcf7-form-control-wrap" data-name="firstName">
                          <input size="40" className="wpcf7-form-control wpcf7-text wpcf7-validates-as-required" aria-required="true" aria-invalid="false" placeholder="名" type="text" name="firstName" value={formData.firstName} onChange={handleChange} required />
                        </span>
                      </div>
                    </dd>
                  </dl>
                  <dl className="sju-field">
                    <dt>
                      <p>会社名・団体名</p>
                    </dt>
                    <dd>
                      <p>
                        <span className="wpcf7-form-control-wrap" data-name="company">
                          <input size="40" className="wpcf7-form-control wpcf7-text" aria-invalid="false" type="text" name="company" value={formData.company} onChange={handleChange} />
                        </span>
                      </p>
                    </dd>
                  </dl>
                  <dl className="sju-field required">
                    <dt>
                      <p>メールアドレス</p>
                    </dt>
                    <dd>
                      <p>
                        <span className="wpcf7-form-control-wrap" data-name="email">
                          <input size="40" className="wpcf7-form-control wpcf7-email wpcf7-validates-as-required wpcf7-text wpcf7-validates-as-email" aria-required="true" aria-invalid="false" placeholder="raru@example.com" type="email" name="email" value={formData.email} onChange={handleChange} required />
                        </span>
                      </p>
                    </dd>
                  </dl>
                  <dl className="sju-field required">
                    <dt>
                      <p>電話番号</p>
                    </dt>
                    <dd>
                      <p>
                        <span className="wpcf7-form-control-wrap" data-name="phone">
                          <input size="40" className="wpcf7-form-control wpcf7-tel wpcf7-validates-as-required wpcf7-text wpcf7-validates-as-tel" aria-required="true" aria-invalid="false" placeholder="090-0000-0000" type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
                        </span>
                      </p>
                    </dd>
                  </dl>
                  <dl className="sju-field">
                    <dt>
                      <p>サイトURL</p>
                    </dt>
                    <dd>
                      <p>
                        <span className="wpcf7-form-control-wrap" data-name="url">
                          <input size="40" className="wpcf7-form-control wpcf7-url wpcf7-text wpcf7-validates-as-url" aria-invalid="false" type="url" name="url" value={formData.url} onChange={handleChange} />
                        </span>
                      </p>
                    </dd>
                  </dl>
                  <dl className="sju-field required">
                    <dt>
                      <p>お問合せ内容</p>
                    </dt>
                    <dd>
                      <p>
                        <span className="wpcf7-form-control-wrap" data-name="message">
                          <textarea cols="40" rows="10" className="wpcf7-form-control wpcf7-textarea wpcf7-validates-as-required" aria-required="true" aria-invalid="false" placeholder="日時・タレント名・商品などお問い合わせ内容をできるだけ詳しくご記入ください" name="message" value={formData.message} onChange={handleChange} required></textarea>
                        </span>
                      </p>
                    </dd>
                  </dl>
                  <div className="sju-form-action">
                    <p className="sju-form-action-lead"></p>
                    <p>
                      <input className="wpcf7-form-control wpcf7-submit has-spinner" type="submit" value="send a mail" disabled={isSubmitting} />
                      {isSubmitting && <span className="wpcf7-spinner"></span>}
                    </p>
                  </div>
                  {statusMessage && <div className="wpcf7-response-output" aria-hidden="false">{statusMessage}</div>}
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Contact;
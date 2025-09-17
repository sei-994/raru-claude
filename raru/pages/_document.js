import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="ja">
      <Head>
        {/* Google Tag Manager */}
        <script dangerouslySetInnerHTML={{
          __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-KXC7V6J');`
        }} />
        {/* End Google Tag Manager */}
        <link rel="profile" href="http://gmpg.org/xfn/11" />
        <link rel="icon" href="/images/raru-logo-black.png" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <title>RARU</title>
        <meta name="description" content="「私らしさ」は、円を描く。今をときめくZ世代のプロダクション＆メディア" />
        <link rel="canonical" href="https://raru-official.jp/" />
        <meta property="og:locale" content="ja_JP" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="RARU" />
        <meta property="og:description" content="「私らしさ」は、円を描く。今をときめくZ世代のプロダクション＆メディア" />
        <meta property="og:url" content="https://raru-official.jp/" />
        <meta property="og:site_name" content="RARU" />
        <meta property="og:image" content="https://raru-official.jp/images/raru-logo.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/png" />
        <meta name="twitter:image" content="https://raru-official.jp/images/raru-logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content=" @RaruTokyo" />
        {/* Typekit Fonts */}
        <link rel="stylesheet" href="https://use.typekit.net/lbp4mob.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300&family=Noto+Serif+JP&display=swap" rel="stylesheet" />
      </Head>
      <body>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-KXC7V6J" height="0" width="0"
                  style={{ display: 'none', visibility: 'hidden' }}></iframe>
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <Main />
        <NextScript />
        <script type="text/javascript" src="/js/script.js"></script>
      </body>
    </Html>
  );
}

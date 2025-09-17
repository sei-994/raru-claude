import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

const About = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const slideInterval = useRef(null);
  const slides = [
    {
      bg: '/images/about/about_mv_01.jpg',
      text: (
        <>
          この 世界の どこかで<br />
          生まれた 小さな 「響き」が、<br />
          やわらかな 円を 描いている。<br />
          ふと 触れた その瞬間に、<br />
          わたしたちの “いま” が<br />
          少し 遠くまで 届く。
        </>
      ),
    },
    {
      bg: '/images/about/about_mv_02.jpg',
      text: (
        <>
          SNS と 現実。<br />
          境界を またぐ たび、<br />
          「私らしさ」は 形を 変え、<br />
          新しい 光を まとう。<br />
          そのすべてを 肯定する<br />
          プラットフォームを つくりたくて、<br />
          RARU は 生まれた。
        </>
      ),
    },
    {
      bg: '/images/about/about_mv_03.jpg',
      text: (
        <>
          Ring Your Rhythm.<br />
          感情の 振動を 可視化し、<br />
          共鳴の 波紋で 結びあう。<br />
          データで 読み解き、<br />
          ストーリーで 紡ぎ、<br />
          次の 一歩へ 導くのが<br />
          わたしたちの 仕事だ。
        </>
      ),
    },
    {
      bg: '/images/about/about_mv_04.jpg',
      text: (
        <>
          オンラインの 波紋が 街へ、<br />
          街で積もった 熱量が 再び<br />
          画面の 向こうへ 還っていく。<br />
          その循環を 「円」で 描きながら、<br />
          今日も 未知の オーラを<br />
          解き放つ クリエイターとともに、<br />
          新しい 景色を 開いていく。
        </>
      ),
    },
  ];

  useEffect(() => {
    let lastExecution = 0;
    const throttleTime = 1000; // 1秒に1回だけ実行

    const handleWheel = (event) => {
      const now = Date.now();
      if (now - lastExecution < throttleTime) {
        return;
      }
      if (event.deltaY > 0) { // 下にスクロール
        lastExecution = now;
        setActiveSlide((prev) => (prev + 1) % slides.length);
      }
    };

    window.addEventListener('wheel', handleWheel);

    slideInterval.current = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // 5秒ごとにスライドを切り替え

    return () => {
      clearInterval(slideInterval.current);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [slides.length]);

  const handleDotClick = (index) => {
    setActiveSlide(index);
    clearInterval(slideInterval.current);
    slideInterval.current = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
  };

  return (
    <div class="about">
      <div id="jsi-about-mv" class="about-mv">
        <div class="about-mv-dot-list jsc-about-mv-dot-list">
          {slides.map((_, index) => (
            <a
              key={index}
              href="#"
              class={`about-mv-dot-item ${activeSlide === index ? 'is-active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                handleDotClick(index);
              }}
            ></a>
          ))}
        </div>
        <div class="about-mv-symbol">
          <div class="about-mv-symbol-logo">
            <Image src="/images/raru-logo-black.png" alt="RARU" width={800} height={340} />
          </div>
        </div>
        <ul id="jsi-about-mv-list" class="about-mv-list">
          {slides.map((slide, index) => (
            <li key={index} class={activeSlide === index ? 'is-active' : ''}>
              <figure
                class="about-mv-figure"
                style={{ backgroundImage: `url('${slide.bg}')` }}
              ></figure>
              <div class="about-mv-container">
                <p class="about-mv-body">
                  {slide.text}
                </p>
              </div>
              
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default About;
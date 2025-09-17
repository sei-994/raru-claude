// RARU Official - JavaScript機能

// スムーススクロール機能
class SmoothScroller {
  constructor() {
    this.init();
  }

  init() {
    const navLinks = document.querySelectorAll('.sidebar-link[href^="#"]');
    
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        
        const targetId = link.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        
        if (targetSection) {
          const targetPosition = targetSection.offsetTop - 20;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
          
          // ナビリンクのアクティブ状態を更新
          this.updateActiveNav(link);
        }
      });
    });
    
    // スクロール時にアクティブリンクを更新
    window.addEventListener('scroll', () => this.updateActiveOnScroll());
  }

  updateActiveNav(activeLink) {
    const navLinks = document.querySelectorAll('.sidebar-link');
    navLinks.forEach(link => link.classList.remove('active'));
    activeLink.classList.add('active');
  }
  
  updateActiveOnScroll() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.sidebar-link');
    
    let currentActiveId = '';
    
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= 200 && rect.bottom >= 200) {
        currentActiveId = section.id;
      }
    });
    
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentActiveId}`) {
        link.classList.add('active');
      }
    });
  }
}

// スクロールエフェクト管理
class ScrollEffects {
  constructor() {
    this.ticking = false;
    this.init();
  }

  init() {
    window.addEventListener('scroll', () => this.requestTick());
  }

  requestTick() {
    if (!this.ticking) {
      requestAnimationFrame(() => this.updateEffects());
      this.ticking = true;
    }
  }

  updateEffects() {
    const scrolled = window.pageYOffset;
    const viewportHeight = window.innerHeight;
    
    // ヘッダーの透明度調整
    this.updateHeaderOpacity(scrolled);
    
    // パララックス効果
    this.updateParallaxEffects(scrolled, viewportHeight);
    
    // 要素のフェードイン効果
    this.updateFadeInEffects(scrolled, viewportHeight);
    
    this.ticking = false;
  }

  updateHeaderOpacity(scrolled) {
    const header = document.querySelector('.header');
    if (header) {
      const opacity = Math.min(scrolled / 100, 0.95);
      header.style.backgroundColor = `rgba(255, 255, 255, ${opacity})`;
    }
  }

  updateParallaxEffects(scrolled, viewportHeight) {
    // ヒーロー背景のパララックス
    const hero = document.querySelector('.hero');
    if (hero) {
      const rate = scrolled * -0.3;
      hero.style.transform = `translateY(${rate}px)`;
    }

    // 波のパララックス
    const waves = document.querySelectorAll('.wave');
    waves.forEach((wave, index) => {
      const rate = scrolled * (-0.2 - index * 0.1);
      wave.style.transform = `translateX(-50%) translateY(${rate}px)`;
    });
  }

  updateFadeInEffects(scrolled, viewportHeight) {
    const animatedElements = document.querySelectorAll('.custom-illustration, .member-card, .news-card');
    
    animatedElements.forEach(element => {
      const elementTop = element.getBoundingClientRect().top + scrolled;
      const elementBottom = elementTop + element.offsetHeight;
      
      if (scrolled + viewportHeight > elementTop + 100 && scrolled < elementBottom) {
        element.classList.add('animate-in');
      }
    });
  }
}

// インタラクティブクイズ機能
class InteractiveQuiz {
  constructor() {
    this.quizOptions = document.querySelectorAll('.quiz-option');
    this.quizResult = document.getElementById('quiz-result');
    this.selectedAnswer = null;
    
    this.init();
  }

  init() {
    this.quizOptions.forEach(option => {
      option.addEventListener('click', () => this.selectAnswer(option));
    });
  }

  selectAnswer(option) {
    // 以前の選択をクリア
    this.quizOptions.forEach(opt => {
      opt.classList.remove('selected');
      opt.style.background = '';
      opt.style.color = '';
    });
    
    // 新しい選択を適用
    option.classList.add('selected');
    option.style.background = 'var(--primary-ocean)';
    option.style.color = 'var(--pure-white)';
    option.style.transform = 'translateY(-5px) scale(1.05)';
    
    this.selectedAnswer = option.dataset.answer;
    
    // 結果を表示
    setTimeout(() => {
      this.showResult();
    }, 800);
  }

  showResult() {
    if (this.quizResult) {
      this.quizResult.style.display = 'block';
      this.quizResult.style.opacity = '0';
      this.quizResult.style.transform = 'translateY(30px)';
      
      // アニメーション効果
      setTimeout(() => {
        this.quizResult.style.transition = 'all 0.6s ease';
        this.quizResult.style.opacity = '1';
        this.quizResult.style.transform = 'translateY(0)';
      }, 100);
      
      // 祝福エフェクトを追加
      this.addCelebrationEffect();
    }
  }

  addCelebrationEffect() {
    const celebrationStars = document.querySelectorAll('.celebration-star');
    celebrationStars.forEach((star, index) => {
      setTimeout(() => {
        star.style.animation = `celebrate 1s ease-out`;
      }, index * 200);
    });
  }
}

// グラデーション変化エフェクト
class GradientChanger {
  constructor() {
    this.colorIndex = 0;
    this.colors = [
      ['#E6F3FF', '#B8D4F5', '#7BB3F0'],
      ['#F0F8FF', '#E0F6FF', '#B3E5FC'],
      ['#E8F5E8', '#C8E6C9', '#A5D6A7'],
      ['#FFF3E0', '#FFE0B2', '#FFCC02']
    ];
    this.init();
  }

  init() {
    setInterval(() => {
      this.changeGradient();
    }, 10000); // 10秒ごとに変化
  }

  changeGradient() {
    const hero = document.querySelector('.hero');
    const interactiveSection = document.querySelector('.interactive-section');
    
    if (hero || interactiveSection) {
      this.colorIndex = (this.colorIndex + 1) % this.colors.length;
      const currentColors = this.colors[this.colorIndex];
      
      const newGradient = `linear-gradient(135deg, ${currentColors[0]} 0%, ${currentColors[1]} 50%, ${currentColors[2]} 100%)`;
      
      if (hero) {
        hero.style.background = newGradient;
        hero.style.transition = 'background 2s ease-in-out';
      }
      
      if (interactiveSection) {
        interactiveSection.style.background = newGradient;
        interactiveSection.style.transition = 'background 2s ease-in-out';
      }
    }
  }
}

// ホバーエフェクト強化
class EnhancedHoverEffects {
  constructor() {
    this.init();
  }

  init() {
    this.addCardHoverEffects();
    this.addButtonHoverEffects();
    this.addNavHoverEffects();
  }

  addCardHoverEffects() {
    const cards = document.querySelectorAll('.member-card, .news-card');
    
    cards.forEach(card => {
      card.addEventListener('mouseenter', (e) => {
        e.currentTarget.style.filter = 'brightness(1.05)';
        e.currentTarget.style.transition = 'all 0.3s ease';
      });
      
      card.addEventListener('mouseleave', (e) => {
        e.currentTarget.style.filter = 'brightness(1)';
      });
    });
  }

  addButtonHoverEffects() {
    const buttons = document.querySelectorAll('.quiz-option, .support-button');
    
    buttons.forEach(button => {
      button.addEventListener('mouseenter', (e) => {
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(74, 144, 226, 0.3)';
      });
      
      button.addEventListener('mouseleave', (e) => {
        e.currentTarget.style.boxShadow = '';
      });
    });
  }

  addNavHoverEffects() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
      link.addEventListener('mouseenter', (e) => {
        e.currentTarget.style.textShadow = '0 2px 4px rgba(74, 144, 226, 0.3)';
      });
      
      link.addEventListener('mouseleave', (e) => {
        e.currentTarget.style.textShadow = '';
      });
    });
  }
}

// 数値カウントアニメーション
class CounterAnimation {
  constructor() {
    this.init();
  }
  
  init() {
    this.observeCounters();
  }
  
  observeCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
            this.animateCounter(entry.target);
            entry.target.classList.add('counted');
          }
        });
      });
      
      counters.forEach(counter => observer.observe(counter));
    }
  }
  
  animateCounter(element) {
    const target = parseInt(element.dataset.target);
    const duration = 2000;
    const steps = 50;
    const increment = target / steps;
    const stepDuration = duration / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      element.textContent = Math.min(Math.floor(current), target);
      
      if (current >= target) {
        element.textContent = target;
        clearInterval(timer);
      }
    }, stepDuration);
  }
}

// スキルバーアニメーション
class SkillBarAnimation {
  constructor() {
    this.init();
  }
  
  init() {
    this.observeSkillBars();
  }
  
  observeSkillBars() {
    const skillBars = document.querySelectorAll('.skill-progress');
    
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
            this.animateSkillBar(entry.target);
            entry.target.classList.add('animated');
          }
        });
      });
      
      skillBars.forEach(bar => observer.observe(bar));
    }
  }
  
  animateSkillBar(element) {
    const skill = element.dataset.skill;
    setTimeout(() => {
      element.style.width = `${skill}%`;
    }, 500);
  }
}

// フェードインアニメーション
class FadeInAnimation {
  constructor() {
    this.init();
  }
  
  init() {
    this.observeFadeInElements();
  }
  
  observeFadeInElements() {
    const fadeElements = document.querySelectorAll('.fade-in');
    
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.style.opacity = '1';
              entry.target.style.transform = 'translateY(0)';
            }, index * 100);
          }
        });
      }, {
        threshold: 0.1
      });
      
      fadeElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        observer.observe(element);
      });
    }
  }
}

// FAQトグル機能
class FAQToggle {
  constructor() {
    this.init();
  }
  
  init() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
      question.addEventListener('click', () => {
        const faqItem = question.closest('.faq-item');
        const isActive = faqItem.classList.contains('active');
        
        // 他のFAQを閉じる
        document.querySelectorAll('.faq-item').forEach(item => {
          item.classList.remove('active');
        });
        
        // クリックされたFAQを開く（既に開いていた場合は閉じる）
        if (!isActive) {
          faqItem.classList.add('active');
        }
      });
    });
  }
}

// ニュースフィルター機能
class NewsFilter {
  constructor() {
    this.init();
  }
  
  init() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    const newsArticles = document.querySelectorAll('.news-article');
    
    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const category = tab.dataset.category;
        
        // アクティブタブを更新
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // 記事をフィルター
        newsArticles.forEach(article => {
          if (category === 'all' || article.dataset.category === category) {
            article.style.display = 'block';
          } else {
            article.style.display = 'none';
          }
        });
      });
    });
  }
}

// メイン初期化クラス
class RARUWebsite {
  constructor() {
    this.components = [];
    this.init();
  }

  init() {
    // DOMが読み込まれた後に初期化
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initializeComponents());
    } else {
      this.initializeComponents();
    }
  }

  initializeComponents() {
    try {
      // 各コンポーネントを初期化
      this.components.push(new SmoothScroller());
      this.components.push(new ScrollEffects());
      
      // クイズとグラデーントは存在する場合のみ
      if (document.querySelector('.quiz-option')) {
        this.components.push(new InteractiveQuiz());
      }
      
      if (document.querySelector('.interactive-section')) {
        this.components.push(new GradientChanger());
      }
      
      this.components.push(new EnhancedHoverEffects());
      
      // 数値カウンターがある場合
      if (document.querySelector('.stat-number')) {
        this.components.push(new CounterAnimation());
      }
      
      // スキルバーがある場合
      if (document.querySelector('.skill-progress')) {
        this.components.push(new SkillBarAnimation());
      }
      
      // フェードイン要素がある場合
      if (document.querySelector('.fade-in')) {
        this.components.push(new FadeInAnimation());
      }
      
      // FAQがある場合
      if (document.querySelector('.faq-item')) {
        this.components.push(new FAQToggle());
      }
      
      // ニュースフィルターがある場合
      if (document.querySelector('.filter-tab')) {
        this.components.push(new NewsFilter());
      }
      
      // カスタムスタイルを追加
      this.addCustomStyles();
      
      console.log('RARU Website initialized successfully');
    } catch (error) {
      console.error('Error initializing RARU Website:', error);
    }
  }

  addCustomStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .animate-in {
        animation: fadeInUp 0.8s ease-out forwards;
      }
      
      .custom-illustration {
        transition: transform 0.3s ease;
      }
      
      .custom-illustration:hover {
        transform: scale(1.05);
      }
      
      .quiz-option.selected {
        animation: selectPulse 0.6s ease;
      }
      
      @keyframes selectPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1.05); }
      }
      
      /* レスポンシブ調整 */
      @media (max-width: 768px) {
        .theme-toggle {
          width: 50px;
          height: 50px;
          top: 1rem;
          right: 1rem;
        }
        
        .hero-title {
          font-size: 3rem !important;
        }
        
        .concept-art,
        .story-art,
        .message-art {
          width: 200px !important;
          height: 200px !important;
        }
      }
      
      /* アクセシビリティ改善 */
      @media (prefers-reduced-motion: reduce) {
        .wave,
        .ripple-circle,
        .floating-note,
        .music-wave,
        .heart-shape,
        .sparkle,
        .star-twinkle {
          animation: none !important;
        }
      }
    `;
    
    document.head.appendChild(style);
  }
}

// ページ読み込み完了時の最終初期化
window.addEventListener('load', () => {
  // 遅延読み込み画像の処理
  const lazyImages = document.querySelectorAll('img[data-src]');
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    });
    
    lazyImages.forEach(img => imageObserver.observe(img));
  }
});

// エラーハンドリング
window.addEventListener('error', (e) => {
  console.error('JavaScript Error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled Promise Rejection:', e.reason);
});

// トップページ ヒーロースライドショー機能
class HeroSlideshow {
  constructor() {
    this.slides = document.querySelectorAll('.hero-slide');
    this.indicators = document.querySelectorAll('.indicator');
    this.currentSlide = 0;
    this.slideInterval = null;
    
    if (this.slides.length > 0) {
      this.init();
    }
  }
  
  init() {
    // インジケータークリックイベント
    this.indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', () => this.goToSlide(index));
    });
    
    // 自動スライドを開始
    this.startAutoSlide();
    
    // マウスホバーで自動スライドを停止/再開
    const heroSection = document.querySelector('.hero-slideshow-section');
    if (heroSection) {
      heroSection.addEventListener('mouseenter', () => this.stopAutoSlide());
      heroSection.addEventListener('mouseleave', () => this.startAutoSlide());
    }
  }
  
  goToSlide(index) {
    // 現在のスライドを非アクティブに
    this.slides[this.currentSlide].classList.remove('active');
    this.indicators[this.currentSlide].classList.remove('active');
    
    // 新しいスライドをアクティブに
    this.currentSlide = index;
    this.slides[this.currentSlide].classList.add('active');
    this.indicators[this.currentSlide].classList.add('active');
  }
  
  nextSlide() {
    const nextIndex = (this.currentSlide + 1) % this.slides.length;
    this.goToSlide(nextIndex);
  }
  
  startAutoSlide() {
    this.stopAutoSlide(); // 既存のインターバルをクリア
    this.slideInterval = setInterval(() => {
      this.nextSlide();
    }, 4000); // 4秒間隔
  }
  
  stopAutoSlide() {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
      this.slideInterval = null;
    }
  }
}

// メインアプリケーション開始
const raruWebsite = new RARUWebsite();
const heroSlideshow = new HeroSlideshow();
import Link from 'next/link';

const Header = () => (
  <div className="sju-nav-wrapper">
    <nav id="jsi-nav" className="sju-nav is-absolute">
      <div className="sju-nav-inner">
        <h1 className="sju-nav-brand">
          <Link href="/" legacyBehavior>
            <a>
              <img src="/images/raru-logo-black.png" alt="RARU" width={400} height={170} />
            </a>
          </Link>
        </h1>
        <div id="jsi-nav-main" className="sju-nav-main">
          <p className="sju-nav-main-lead">menu</p>
          <ul className="sju-nav-list">
            <li><Link href="/talents" legacyBehavior><a className="sju-nav-item">talent</a></Link></li>
            <li><Link href="/media" legacyBehavior><a className="sju-nav-item">topics</a></Link></li>
            <li><Link href="/contact" legacyBehavior><a className="sju-nav-item">contact</a></Link></li>
          </ul>
        </div>
        <div id="jsi-sp-nav-toggle" className="sju-nav-hamburger">
          <i></i>
          <i></i>
          <i></i>
        </div>
      </div>
    </nav>
  </div>
);

export default Header;

import Header from './Header';

const Layout = ({ children }) => (
  <>
    <Header />
    <div id="jsi-scroller" className="sju-wrapper">
      <main className="sju-page">{children}</main>
    </div>
  </>
);

export default Layout;

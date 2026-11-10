import Document, { Html, Head, Main, NextScript } from 'next/document';
import TYPES from 'types';

//same rule as hooks/useDarkMode: saved choice, else the system setting
const themeScript = `try{var t=(JSON.parse(localStorage.getItem('context')||'{}')||{}).theme;if(t==='${TYPES.THEME.DARK}'||(t==null&&matchMedia('(prefers-color-scheme: dark)').matches))document.body.classList.add('${TYPES.THEME.DARK}')}catch(e){}`;

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html lang="en">
        <Head>
          <link rel="icon" href="/favicon.svg" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin=""
          />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
          />
          <meta name="theme-color" content="#0b2235" />
        </Head>
        <body className={TYPES.THEME.LIGHT}>
          {/* apply the saved / system theme before the first paint, React only takes over after hydration */}
          <script dangerouslySetInnerHTML={{ __html: themeScript }} />
          <Main />
          <div id="__portal" />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;

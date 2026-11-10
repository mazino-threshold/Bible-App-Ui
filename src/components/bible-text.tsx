'use dom';

// Renders YouVersion's Bible HTML. A DOM component: on Android/iOS it runs in a WebView (Expo's
// @expo/dom-webview, built into SDK 58), on web it renders straight into the page.
import { IS_DOM, type DOMProps } from 'expo/dom';
import type { CSSProperties } from 'react';
import type { PassageChapter } from '@/api/types';
import { colors } from '@/constants/theme';

// YouVersion asks apps to style their HTML with this. Its rules only apply inside
// [data-slot=yv-bible-renderer], so it doesn't touch the rest of the page on web.
const BIBLE_CSS = 'https://cdn.youversion.com/platform/1/bible.css';

interface Props {
  chapters: PassageChapter[];
  /** e.g. 'New International Version 2011' */
  versionTitle: string;
  /** Must always be shown with the text (publisher's licence). */
  copyright: string;
  dom?: DOMProps;
}

export default function BibleText({ chapters, versionTitle, copyright }: Props) {
  return (
    <div style={styles.page}>
      {/* React 19 moves this into <head> */}
      <link rel="stylesheet" href={BIBLE_CSS} precedence="default" />
      {/* Only inside the WebView: on web this would restyle the whole app's page */}
      {IS_DOM ? <style>{`html, body { margin: 0; background: ${colors.background}; }`}</style> : null}

      {chapters.map((chapter) => (
        <section key={chapter.id} style={styles.chapter}>
          <h2 style={styles.reference}>{chapter.reference}</h2>
          <div
            data-yv-sdk=""
            data-slot="yv-bible-renderer"
            style={styles.renderer}
            // The HTML comes from YouVersion through our own API, which is how their SDK renders it too
            dangerouslySetInnerHTML={{ __html: chapter.html }}
          />
        </section>
      ))}

      <footer style={styles.copyright}>
        <p style={styles.version}>{versionTitle}</p>
        <p style={styles.notice}>{copyright}</p>
      </footer>
    </div>
  );
}

// Plain objects (not StyleSheet): this file renders DOM elements, not React Native views
const styles = {
  page: {
    boxSizing: 'border-box',
    maxWidth: 640,
    margin: '0 auto',
    padding: '16px 16px 32px',
    color: colors.text,
    background: colors.background,
  },
  chapter: { marginBottom: 32 },
  reference: {
    fontFamily: 'Georgia, serif',
    fontSize: 22,
    fontWeight: 700,
    color: colors.primary,
    margin: '0 0 8px',
  },
  // bible.css reads these. Its default colour is near-black and 20px; match the app instead.
  // (CSS variables aren't in React's style type, hence the cast.)
  renderer: {
    '--yv-foreground': colors.text,
    '--yv-muted-foreground': colors.accent,
    '--yv-reader-font-size': '18px',
  } as CSSProperties,
  copyright: {
    borderTop: `1px solid ${colors.border}`,
    paddingTop: 16,
    fontFamily: 'system-ui, sans-serif',
    fontSize: 13,
    lineHeight: 1.5,
    color: colors.textMuted,
  },
  version: { margin: '0 0 4px', fontWeight: 600 },
  notice: { margin: 0, whiteSpace: 'pre-line' },
} satisfies Record<string, CSSProperties>;

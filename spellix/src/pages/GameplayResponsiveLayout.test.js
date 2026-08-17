import { readFileSync } from 'fs';

describe('responsive gameplay layout', () => {
  test('scales the exact board and sidebar footprint inside the viewport', () => {
    const pageSource = readFileSync('src/pages/GameplayPage.jsx', 'utf8');
    const stylesheet = readFileSync('src/pages/GameplayPage.css', 'utf8');

    expect(pageSource).toMatch(/className="gameplay-viewport"/);
    expect(pageSource).toMatch(/className="gameplay-scale-root"/);
    expect(pageSource).toMatch(/--gameplay-scale/);
    expect(pageSource).toMatch(
      /window\.addEventListener\('resize', handleResize\)/
    );
    expect(pageSource).toMatch(
      /window\.removeEventListener\('resize', handleResize\)/
    );
    expect(stylesheet).toMatch(
      /\.gameplay-viewport\s*{[^}]*height:\s*100dvh;[^}]*overflow:\s*hidden;/s
    );
    const scaleRootRule = stylesheet.match(
      /\.gameplay-scale-root\s*{([^}]*)}/s
    )?.[1];

    expect(scaleRootRule).toMatch(/height:\s*940px;/);
    expect(scaleRootRule).toMatch(/width:\s*1320px;/);
    expect(scaleRootRule).toMatch(
      /transform:\s*scale\(var\(--gameplay-scale\)\);/
    );
    expect(scaleRootRule).toMatch(/transform-origin:\s*top center;/);
  });

  test('keeps modal overlays outside the transformed gameplay shell', () => {
    const pageSource = readFileSync('src/pages/GameplayPage.jsx', 'utf8');

    expect(pageSource).toMatch(
      /className="gameplay-viewport"[\s\S]*className="gameplay-scale-root"[\s\S]*className="gameplay-layout"[\s\S]*<BoardGrid[\s\S]*className="gameplay-sidebar"[\s\S]*<\/section>\s*<\/div>\s*<\/div>\s*<\/div>\s*<ChooseEventModal/
    );
  });

  test('constrains shared modal panels to the dynamic viewport height', () => {
    const stylesheet = readFileSync('src/components/Modal.css', 'utf8');

    expect(stylesheet).toMatch(
      /\.modal-panel--default\s*{[^}]*max-height:\s*calc\(100dvh - 32px\);[^}]*overflow:\s*auto;/s
    );
    expect(stylesheet).toMatch(/\.modal-body\s*{[^}]*min-height:\s*0;/s);
  });
});

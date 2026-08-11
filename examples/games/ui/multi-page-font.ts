import {
  FlxAssets,
  FlxG,
  type FlxAssetDescriptor,
  type FlxBitmapFont,
} from '../../../src';

export const MULTI_PAGE_FONT_ALIAS = 'ui-multi-page-font';

export const multiPageFontDescriptor: FlxAssetDescriptor = {
  alias: MULTI_PAGE_FONT_ALIAS,
  parser: 'bitmap-font',
  src: '/ui/assets/ui-multi-page.fnt',
};

export function requireMultiPageUiFont(): FlxBitmapFont {
  const font = FlxAssets.fromContext(FlxG.context)?.getBitmapFont(
    MULTI_PAGE_FONT_ALIAS,
  );
  if (font === undefined) {
    throw new Error('The UI multi-page bitmap font was not preloaded.');
  }
  return font;
}

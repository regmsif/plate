import {
  type PluginConfig,
  type QueryNodeOptions,
  createTSlatePlugin,
} from '@udecode/plate';

export interface SoftBreakRule {
  hotkey: string;

  /** Filter the block types where the rule applies. */
  query?: QueryNodeOptions;
}

export type SoftBreakConfig = PluginConfig<
  'softBreak',
  {
    rules?: SoftBreakRule[];
  }
>;

/**
 * Insert soft break following configurable rules. Each rule specifies a hotkey
 * and query options.
 */
export const BaseSoftBreakPlugin = createTSlatePlugin<SoftBreakConfig>({
  key: 'softBreak',
  options: {
    rules: [{ hotkey: 'shift+enter' }],
  },
});

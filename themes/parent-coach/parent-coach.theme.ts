// The parent-coach theme. `astryx experimental theme editor` wrote this file once and never changes it again.
// The checked settings live in parent-coach.settings.json and the generated parent-coach.settings.ts;
// change them with `astryx experimental theme editor set parent-coach ...`. Add your own changes below: they win over the settings.
import {defineTheme} from '@astryxdesign/core/theme';
import {parentCoachSettings} from './parent-coach.settings';

export const parentCoachTheme = defineTheme({
  extends: parentCoachSettings,
  name: 'parent-coach',
});

const locales = [
  {
    code: 'zh-TW',
    shortCode: 'zh',
    name: '繁體中文'
  },
  // {
  //   code: 'en-US',
  //   shortCode: 'en',
  //   name: 'English'
  // },
]

export const i18n = {
  defaultLocale: locales[0],
  locales
} as const

export type TypeI18n = typeof i18n
export type Locale = (typeof i18n)['locales'][number]

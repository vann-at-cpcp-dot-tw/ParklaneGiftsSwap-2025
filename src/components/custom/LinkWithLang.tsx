"use client"

import { createLinkWithLangComponent } from "vanns-common-modules/dist/components/next/CreateLinkWithLang"

import { i18n } from '~~/i18n.config'

const LinkWithLang = createLinkWithLangComponent(i18n.defaultLocale.shortCode)

export default LinkWithLang

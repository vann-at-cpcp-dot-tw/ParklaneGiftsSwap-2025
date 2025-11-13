const API_URL = `${process.env.NEXT_PUBLIC_API_BASE}graphql`
const REVALIDATE = Number(process.env.NEXT_PUBLIC_REVALIDATE || 60)

import { TypedDocumentNode } from "@graphql-typed-document-node/core"
import { headers } from 'next/headers'
import { IFetchGQLArgs } from "vanns-common-modules/dist/lib/next/apollo"
import { makeApolloClient, makeFetcher } from "vanns-common-modules/dist/lib/next/apollo/server"
import { tools as langTools } from "vanns-common-modules/dist/use/next/useLangGuard"

import { i18n } from "~~/i18n.config"


const { convertLocaleCode } = langTools(i18n)

const { getClient } = makeApolloClient({
  uri: API_URL,
  revalidate: REVALIDATE
  // memoryCacheOptions: {
  //   typePolicies: {
  //     myElementNode: {
  //       keyFields: ['id', 'name'],
  //     },
  //   },
  // },
})

const fetchGQLWrapper = makeFetcher(getClient)

export async function fetchGQL(query:TypedDocumentNode, args?:IFetchGQLArgs){
  const { context, ...restArgs } = args ?? {}
  const contextHeaders = context?.headers || {}
  const headersList = await headers()
  const requestLang = headersList.get('x-lang') || i18n.defaultLocale.shortCode
  // const localeCode = convertLocaleCode(lang, 'long')

  const formattedFetchArgs = {
    ...restArgs,
    context: {
      uri: context?.uri || API_URL,
      ...(context || {}),
      headers: {
        ...contextHeaders
        // "accept-language": localeCode
      }
    },
    variables: {
      ...(args?.variables || {}),
      // language: requestLang.toUpperCase(),
      // translation: requestLang.toUpperCase(),
    }
  }

  return await fetchGQLWrapper(query, formattedFetchArgs)
}
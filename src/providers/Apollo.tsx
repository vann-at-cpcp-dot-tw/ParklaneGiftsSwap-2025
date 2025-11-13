"use client"
const API_URL = `${process.env.NEXT_PUBLIC_API_BASE}graphql`

import { ApolloLink } from "@apollo/client"
import { makeApolloClient, ApolloClientProvider } from "vanns-common-modules/dist/lib/next/apollo/client"
import { useLangGuard } from "vanns-common-modules/dist/use/next/useLangGuard"

import { i18n } from "~~/i18n.config"


export default function ApolloProvider({
  children
}:{
  children: React.ReactNode,
}){

  const { lang, localeCode } = useLangGuard(i18n)
  const languageLink = new ApolloLink((operation:any, forward:any) => {
    operation.variables = {
      ...operation.variables,
      // language: (lang as string).toUpperCase(),
      // translation: (lang as string).toUpperCase(),
    }
    return forward(operation)
  })

  return <ApolloClientProvider makeClient={()=>{
    const { getClient } = makeApolloClient({
      uri: API_URL,
      // context: {
      //   headers: {
      //     "accept-language": localeCode
      //   }
      // },
      // memoryCacheOptions: {
      //   typePolicies: {
      //     myElementNode: {
      //       keyFields: ['id', 'name'],
      //     },
      //   },
      // },
      middlewares: [
        languageLink
      ]
    })
    return getClient()
  }}>
    { children }
  </ApolloClientProvider>
}
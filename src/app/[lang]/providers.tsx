import '~/styles/index.sass'
import { ReactNode } from 'react'

import { ReactQueryClientProvider } from "vanns-common-modules/dist/providers/react"

import ApolloProvider from "~/providers/Apollo"
import { CommonDataProvider, ICommonData } from "~/providers/CommonData"

export default function Providers({
  children,
  commonData,
}:{
  children: ReactNode,
  commonData: ICommonData
}) {

  return <ApolloProvider>
    <ReactQueryClientProvider>
      <CommonDataProvider state={commonData}>
        { children }
      </CommonDataProvider>
    </ReactQueryClientProvider>
  </ApolloProvider>
}
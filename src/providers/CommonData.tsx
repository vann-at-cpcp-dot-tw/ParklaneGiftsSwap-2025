"use client"

import { createScopeStoreProvider } from "vanns-common-modules/dist/providers/react"

export interface ICommonData {
  [key:string]: any
}

export const { ScopeStoreProvider:CommonDataProvider, useScopeStore:useCommonData } = createScopeStoreProvider<ICommonData>()
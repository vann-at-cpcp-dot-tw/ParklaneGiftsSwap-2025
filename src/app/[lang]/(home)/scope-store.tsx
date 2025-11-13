"use client"

import { createScopeStoreProvider } from "vanns-common-modules/dist/providers/react"

interface IScopeStore {
  [key:string]: any
}

export const { ScopeStoreProvider, useScopeStore } = createScopeStoreProvider<IScopeStore>()
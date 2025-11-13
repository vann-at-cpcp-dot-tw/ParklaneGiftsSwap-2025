import { createStore } from 'vanns-common-modules/dist/store'

const defaultStore = {
  currency: 'TWD',
  lightbox: [],
  common: {},
}

export const { useStore } = createStore(defaultStore)

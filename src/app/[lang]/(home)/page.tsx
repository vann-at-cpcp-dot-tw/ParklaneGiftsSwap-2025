const APP_BASE = process.env.NEXT_PUBLIC_APP_BASE || '/'

import Image from "next/image"

import LinkWithLang from "~/components/custom/LinkWithLang"
import { isEmpty } from '~/lib/utils'

import { ScopeStoreProvider } from "./scope-store"

interface IProps {
  params: Promise<{
    lang: string
  }>
}

interface IState {
  [key:string]: any
}


async function getHomePageData(){
  // const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/wp-json/api/v1/homeDatas`, {
  //   method: 'GET',
  //   next: {
  //     revalidate: 60
  //   },
  // })

  // const json = await response.json()

  // return json?.data

  return {hello:'world'}
}

export default async function Home({params}:IProps) {
  const { lang } = await params
  const data = await getHomePageData()

  return <ScopeStoreProvider state={{data}}>
    <main className="flex h-full flex-col justify-center">
      <div className="container text-center">::: Home page content :::</div>
    </main>
  </ScopeStoreProvider>

}

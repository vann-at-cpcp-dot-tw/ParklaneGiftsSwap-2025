const APP_BASE = process.env.NEXT_PUBLIC_APP_BASE || '/'

import Image from "next/image"

import LinkWithLang from "~/components/custom/LinkWithLang"
import { isEmpty } from '~/lib/utils'

interface IProps {
  params: {
    lang: string
  }
}

interface IState {
  [key:string]: any
}

export default function ExamplePage({params}:IProps){
  const { lang } = params

  return <main>
  </main>
}

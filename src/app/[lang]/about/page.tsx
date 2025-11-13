"use client"

import Image from 'next/image'
import Link from 'next/link'
import { useWindowSize } from "vanns-common-modules/dist/use/react"

import { Button } from '~/components/ui/button'
import { useStore } from '~/store'

import styles from './page.module.css'

export default function About(){

  const store = useStore()
  const viewport = useWindowSize()

  return <main className="flex h-full flex-col justify-center">
    <div className="container text-center">::: About page content :::</div>
    <div className="container flex justify-center py-5">
      <Link href="/">
        <Button variant="outline">BACK</Button>
      </Link>
    </div>
  </main>
}

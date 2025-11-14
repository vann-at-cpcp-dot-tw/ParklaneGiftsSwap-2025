import '~~/public/external-import.css'

import Script from 'next/script'

import Providers from '~/app/[lang]/providers'
import Footer from '~/components/custom/Footer'
import Header from '~/components/custom/Header'
import { isEmpty } from '~/lib/utils'

export const metadata = {
  title: 'NEXT WITH APP ROUTER',
  description: '',
}

async function getCommonData(){
  // const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/wp-json/api/v1/commonDatas`, {
  //   method: 'GET',
  //   next: {
  //     revalidate: 60
  //   },
  // })

  // const json = await response.json()

  // return json?.data
  return {}
}

export default async function RootLayout({
  children
}: {
  children: React.ReactNode
}) {

  // fetch data from server side
  const commonData = await getCommonData()

  return <html>
    <body>
      {/* 載入 Epson ePOS SDK */}
      <Script src="/lib/epos-2.27.0.js" strategy="beforeInteractive" />

      <Providers commonData={commonData}>
        <div className="pointer-events-none fixed left-0 top-0 size-full"
        style={{
          backgroundImage: 'url(/img/bg.svg)',
          backgroundRepeat: 'repeat',
          zIndex: 0,
        }}></div>
        <div id="app" className="flex h-screen flex-col" style={{ zIndex: 1}}>
          {/* <Header /> */}
          <div className="grow">
            { children }
          </div>
          {/* <Footer /> */}
        </div>
      </Providers>
    </body>
  </html>
}

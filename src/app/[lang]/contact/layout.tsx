import { isEmpty } from '~/lib/utils'

export default async function ContactLayout({
  children
}: {
  children: React.ReactNode
}) {

  return <div className="container h-full">
    <div className="row h-full">
      <div className="col-3">
        <div className="flex h-full flex-col justify-center bg-gray-100 text-center">::: Sidebar :::</div>
      </div>
      <div className="col-9">{ children }</div>
    </div>
  </div>
}

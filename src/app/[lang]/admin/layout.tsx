import GuardWrapper from '~/components/custom/GuardWrapper'

export default function AdminLayout({
  children,
}: {
    children: React.ReactNode
  }) {
  return <GuardWrapper>{children}</GuardWrapper>
}
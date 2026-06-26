import { LoginForm } from '@/features/auth/LoginForm'

type SearchParams = Promise<{ redirect?: string | string[] }>

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const { redirect } = await searchParams
  const redirectPath = Array.isArray(redirect) ? redirect[0] : redirect

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold text-foreground">Anmelden</h1>
      <LoginForm redirectPath={redirectPath} />
    </>
  )
}

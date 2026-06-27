import { RegisterForm } from '@/features/auth/RegisterForm'

type SearchParams = Promise<{ redirect?: string | string[] }>

export default async function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  const { redirect } = await searchParams
  const redirectPath = Array.isArray(redirect) ? redirect[0] : redirect

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold text-foreground">Konto erstellen</h1>
      <RegisterForm redirectPath={redirectPath} />
    </>
  )
}

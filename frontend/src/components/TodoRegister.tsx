'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function TodoRegister() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading, register } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push('/todos')
    }
  }, [isAuthenticated, authLoading, router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      setError('')
      setLoading(true)

      await register(name, email, password)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar conta'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader>
        <CardTitle>Criar sua conta</CardTitle>
        <CardDescription>
          Preencha os dados para se cadastrar
        </CardDescription>
        <CardAction>
          <Button variant="link" onClick={() => router.push('/todos')}>
            Já tenho conta
          </Button>
        </CardAction>
      </CardHeader>
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-y-4">
        <CardContent>
          <div className="flex flex-col gap-6">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
                {error}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                minLength={5}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-y-4">
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Criando conta...' : 'Criar conta'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

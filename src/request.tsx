const BASE_URL = (import.meta as any)?.env?.VITE_API_BASE_URL ?? 'http://127.0.0.1:5000'

export type ApiResult<T> = { status: number; data: T | undefined }

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const hasBody = Boolean(init?.body)
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers || {})
    },
    ...init
  })

  const contentType = res.headers.get('content-type') ?? ''
  let payload: unknown

  if (contentType.includes('application/json')) {
    payload = await res.json().catch(() => undefined)
  } else {
    const text = await res.text().catch(() => '')
    payload = text || undefined
  }

  return { status: res.status, data: payload as T | undefined }
}

export type SignupInput = {
  email: string
  password: string
  username?: string
}

export type UserAccount = {
  id: number
  username: string
  email: string
}

export type SignupResponse = {
  status: 'ok'
  user: UserAccount
}

export async function signup(input: SignupInput): Promise<ApiResult<SignupResponse | string>> {
  return jsonFetch<SignupResponse | string>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(input)
  })
}

export type LoginInput = {
  email: string
  password: string
}

export type LoginResponse = {
  status: 'ok'
  session_id: string
  user: UserAccount
}

export async function login(input: LoginInput): Promise<ApiResult<LoginResponse | string>> {
  return jsonFetch<LoginResponse | string>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input)
  })
}

export type TopicSummary = {
  id: number
  title: string
  author: string
}

export type TopicsResponse = {
  items: TopicSummary[]
  count: number
}

export async function fetchTopics(): Promise<ApiResult<TopicsResponse | string>> {
  return jsonFetch<TopicsResponse | string>('/topics')
}

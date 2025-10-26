const BASE_URL = (import.meta as any)?.env?.VITE_API_BASE_URL ?? ''

export type ApiResult<T> = { status: number; data: T }

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    },
    ...init
  })

  const isJson = res.headers.get('content-type')?.includes('application/json')
  const payload = isJson ? await res.json().catch(() => undefined) : undefined

  return { status: res.status, data: payload as T }
}

export type SignupInput = {
  email: string,
  password: string
}

export type SignupResponse = {
  detail: string
}

export async function signup(
  input: SignupInput,
): Promise<ApiResult<SignupResponse>> {
  return jsonFetch<SignupResponse>('/user/create', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export type LoginInput = {
  email: string,
  password: string,
}

export type LoginResponse = {
  detail: string
}

export async function login(
  input: LoginInput,
): Promise<ApiResult<LoginResponse>> {
  return jsonFetch<LoginResponse>('/user/login', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export type TopicList = {
  detail: {
    title: string,
    id: number,
    auther: string,
  }
}

export async function fetchTopic(): Promise<ApiResult<TopicList>> {
  return jsonFetch<TopicList>('/topics')
}

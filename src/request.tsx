const BASE_URL = (import.meta as any)?.env?.VITE_API_BASE_URL ?? 'http://127.0.0.1:5000'
const AUTH_STORAGE_KEY = 'philosophy-forum.session-token'
const SESSION_COOKIE_NAME = 'session_id'

export type ApiResult<T> = { status: number; data: T | undefined }

const browserStorage =
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
    ? window.localStorage
    : null

let authToken: string | null = browserStorage?.getItem(AUTH_STORAGE_KEY) ?? null

function readSessionCookie() {
  if (typeof document === 'undefined') {
    return null
  }

  const cookieSource = document.cookie
  if (!cookieSource) {
    return null
  }

  const segments = cookieSource.split(';')
  for (const segment of segments) {
    const [rawName, ...rawValue] = segment.trim().split('=')
    if (!rawName || rawName !== SESSION_COOKIE_NAME) {
      continue
    }
    const value = rawValue.join('=')
    return value ? decodeURIComponent(value) : null
  }

  return null
}

if (!authToken) {
  const cookieToken = readSessionCookie()
  if (cookieToken) {
    authToken = cookieToken.trim() || null
  }
}

function persistAuthToken(token: string | null) {
  if (!browserStorage) return
  if (token) {
    browserStorage.setItem(AUTH_STORAGE_KEY, token)
  } else {
    browserStorage.removeItem(AUTH_STORAGE_KEY)
  }
}

function normaliseAuthHeader(token: string) {
  const trimmed = token.trim()
  if (!trimmed) return ''
  const hasKnownPrefix = /^(bearer|session)\s+/i.test(trimmed)
  return hasKnownPrefix ? trimmed : `Bearer ${trimmed}`
}

export function setAuthToken(token: string | null) {
  authToken = token?.trim() || null
  persistAuthToken(authToken)
}

export function getAuthToken(): string | null {
  return authToken
}

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const hasBody = Boolean(init?.body)
  const headers = new Headers(init?.headers ?? undefined)
  if (hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (authToken && !headers.has('Authorization')) {
    const headerValue = normaliseAuthHeader(authToken)
    if (headerValue) {
      headers.set('Authorization', headerValue)
      if (!headers.has('X-Session-Id')) {
        headers.set('X-Session-Id', authToken)
      }
    }
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers,
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

export type UpdateUserInput = {
  email: string
  username?: string
  password?: string
}

export type UpdateUserResponse = {
  status: 'ok'
  user: UserAccount
}

export async function updateUser(
  input: UpdateUserInput
): Promise<ApiResult<UpdateUserResponse | string>> {
  return jsonFetch<UpdateUserResponse | string>('/users/update', {
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

type ApiMessage = { message?: string; error?: string }

export type TopicDetailComment = {
  id: number
  topic_id?: number
  author?: string
  content?: string
  body?: string
  created_at?: string
  createdAt?: string
}

export type TopicDetailResponse = {
  id: number
  author?: string
  title?: string
  description?: string
  closed?: boolean
  likes?: number
  comments?: TopicDetailComment[]
}

export async function fetchTopicDetail(
  topicId: number
): Promise<ApiResult<TopicDetailResponse | ApiMessage | string>> {
  return jsonFetch<TopicDetailResponse | ApiMessage | string>(`/topic/${topicId}`)
}

export type CreateCommentResponse = {
  id: number
  author?: string
  body?: string
  content?: string
  createdAt?: string
  created_at?: string
}

export async function postTopicComment(
  topicId: number,
  content: string
): Promise<ApiResult<CreateCommentResponse | ApiMessage | string>> {
  const payload: { content: string; session_id?: string } = { content }
  if (authToken) {
    payload.session_id = authToken
  }
  return jsonFetch<CreateCommentResponse | ApiMessage | string>(`/topics/${topicId}/comments`, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import {
  fetchTopics,
  signup,
  login,
  logout,
  updateUser,
  TopicsResponse,
  setAuthToken,
  getAuthToken,
  fetchTopicDetail,
  TopicDetailResponse,
  createTopic,
  closeTopic
} from './request'
import { ToastMessage, Topic, UserProfile } from './types'
import { Toast } from './components/Toast'
import { TopBar } from './components/TopBar'
import { TopicsView } from './components/TopicsView'
import { TopicDetail } from './components/TopicDetail'
import { TopicNotFound } from './components/TopicNotFound'
import { LoginPanel } from './components/LoginPanel'
import { SignupPanel } from './components/SignupPanel'
import { ProfilePanel } from './components/ProfilePanel'
import { AccountSettingsPanel } from './components/AccountSettingsPanel'
import { CreateTopicPanel } from './components/CreateTopicPanel'

const USER_STORAGE_KEY = 'philosophy-forum.current-user'
const DEFAULT_USER_NAME = '已登录用户'

function getUserStorage(): Storage | null {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return null
  }
  return window.localStorage
}

function sanitiseUserProfile(profile: Partial<UserProfile> | null | undefined): UserProfile | null {
  if (!profile) {
    return null
  }

  const name =
    typeof profile.name === 'string' && profile.name.trim().length > 0
      ? profile.name.trim()
      : DEFAULT_USER_NAME
  const email = typeof profile.email === 'string' ? profile.email : ''

  return { name, email }
}

function loadStoredUserProfile(): UserProfile | null {
  const storage = getUserStorage()
  if (!storage) {
    return null
  }

  try {
    const raw = storage.getItem(USER_STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as Partial<UserProfile> | null
    return sanitiseUserProfile(parsed)
  } catch (_) {
    return null
  }
}

function persistUserProfile(profile: UserProfile | null) {
  const storage = getUserStorage()
  if (!storage) {
    return
  }

  if (!profile) {
    storage.removeItem(USER_STORAGE_KEY)
    return
  }

  try {
    storage.setItem(USER_STORAGE_KEY, JSON.stringify(profile))
  } catch (_) {
    // Ignore storage quota or availability errors
  }
}

function createFallbackUser(): UserProfile {
  return { name: DEFAULT_USER_NAME, email: '' }
}

function normaliseAuthorName(author: unknown, fallback = '未知'): string {
  if (typeof author === 'string') {
    const trimmed = author.trim()
    return trimmed || fallback
  }

  if (typeof author === 'number' || typeof author === 'boolean') {
    const text = String(author).trim()
    return text || fallback
  }

  if (author && typeof author === 'object') {
    const record = author as Record<string, unknown>
    const candidateKeys = ['username', 'name', 'author', 'email', 'displayName']
    for (const key of candidateKeys) {
      const value = record[key]
      if (typeof value === 'string') {
        const trimmed = value.trim()
        if (trimmed) {
          return trimmed
        }
      }
    }

    const labelled = (record as { toString?: () => string }).toString?.()
    if (labelled && labelled !== '[object Object]') {
      const trimmed = labelled.trim()
      if (trimmed) {
        return trimmed
      }
    }
  }

  return fallback
}

const AUTHOR_CANDIDATE_KEYS = ['username', 'name', 'author', 'email', 'displayName', 'id'] as const
const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi

function enumerateAuthorStrings(author: unknown): string[] {
  if (author == null) {
    return []
  }

  if (typeof author === 'string' || typeof author === 'number' || typeof author === 'boolean') {
    return [String(author)]
  }

  if (typeof author === 'object') {
    const record = author as Record<string, unknown>
    const values: string[] = []

    for (const key of AUTHOR_CANDIDATE_KEYS) {
      const value = record[key]
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        values.push(String(value))
      }
    }

    const labelled = (record as { toString?: () => string }).toString?.()
    if (labelled && labelled !== '[object Object]') {
      values.push(labelled)
    }

    return values
  }

  return []
}

function collectAuthorTokens(
  author: unknown,
  fallbackValues: (string | null | undefined)[] = []
): string[] {
  const tokens = new Set<string>()

  const addToken = (value: string | null | undefined) => {
    if (!value) {
      return
    }
    const trimmed = value.trim().toLowerCase()
    if (trimmed) {
      tokens.add(trimmed)
    }
  }

  const processString = (value: string | null | undefined) => {
    if (!value) {
      return
    }
    const trimmed = value.trim()
    if (!trimmed) {
      return
    }

    addToken(trimmed)

    const emailMatches = trimmed.match(EMAIL_PATTERN)
    if (emailMatches) {
      for (const email of emailMatches) {
        addToken(email)
        const [localPart] = email.split('@')
        addToken(localPart)
      }
    }

    const beforeBracket = trimmed.split(/[\(<\[]/)[0]
    addToken(beforeBracket)

    const fragments = trimmed.split(/[^A-Za-z0-9@._+-]+/)
    for (const fragment of fragments) {
      addToken(fragment)
    }
  }

  for (const fallback of fallbackValues) {
    processString(fallback ?? undefined)
  }

  for (const candidate of enumerateAuthorStrings(author)) {
    processString(candidate)
  }

  return Array.from(tokens).filter(Boolean)
}

function deriveAuthorProfile(
  author: unknown,
  fallbackName: string,
  fallbackTokens: string[] = []
): { name: string; tokens: string[] } {
  const displayName = normaliseAuthorName(author, fallbackName)
  const tokens = collectAuthorTokens(author, [...fallbackTokens, fallbackName, displayName])
  return { name: displayName, tokens: Array.from(new Set(tokens)) }
}

function collectUserTokens(user: UserProfile): string[] {
  return collectAuthorTokens(
    { name: user.name, email: user.email },
    [user.name, user.email]
  )
}

type View = 'home' | 'topic' | 'login' | 'signup' | 'profile' | 'settings' | 'create-topic'

type ToastState = ToastMessage | null

function mergeTopicDetailResponse(
  detail: TopicDetailResponse,
  fallback: Topic | null
): Topic {
  const topicId = detail.id ?? fallback?.id ?? 0
  const fallbackComments = fallback?.comments ?? []

  const mappedComments: Topic['comments'] = Array.isArray(detail.comments)
    ? detail.comments.map((comment, index) => {
        const backup = fallbackComments[index]
        const commentBody = comment.content ?? comment.body ?? backup?.body ?? ''
        const commentCreatedAt =
          comment.created_at ??
          comment.createdAt ??
          backup?.createdAt ??
          new Date().toISOString()

        return {
          id: comment.id ?? backup?.id ?? index,
          author: normaliseAuthorName(comment.author ?? backup?.author, backup?.author ?? '匿名用户'),
          body: commentBody,
          createdAt: commentCreatedAt
        }
      })
    : fallbackComments

  const fallbackAuthor = fallback?.author ?? '未知'
  const fallbackAuthorTokens = fallback?.authorTokens ?? []
  const authorProfile = deriveAuthorProfile(
    detail.author ?? fallbackAuthor,
    fallbackAuthor,
    fallbackAuthorTokens
  )

  return {
    id: topicId,
    title: detail.title ?? fallback?.title ?? `话题 ${topicId}`,
    author: authorProfile.name,
    authorTokens: authorProfile.tokens,
    description: detail.description ?? fallback?.description ?? '',
    closed: detail.closed ?? fallback?.closed ?? false,
    likes: detail.likes ?? fallback?.likes,
    comments: mappedComments
  }
}

function App() {
  const [view, setView] = useState<View>('home')
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [allTopics, setAllTopics] = useState<Topic[]>([])
  const [toast, setToast] = useState<ToastState>(null)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const token = getAuthToken()
    if (!token) {
      return null
    }

    const stored = loadStoredUserProfile()
    return stored ?? createFallbackUser()
  })

  useEffect(() => {
    if (!currentUser && getAuthToken()) {
      const stored = loadStoredUserProfile()
      setCurrentUser(stored ?? createFallbackUser())
    }
  }, [currentUser])

  // Signup form state
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('')
  const [signupLoading, setSignupLoading] = useState(false)
  const [signupMessage, setSignupMessage] = useState<string | null>(null)
  const [signupError, setSignupError] = useState(false)
  const [settingsName, setSettingsName] = useState('')
  const [settingsPassword, setSettingsPassword] = useState('')
  const [settingsConfirmPassword, setSettingsConfirmPassword] = useState('')
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [createTopicTitle, setCreateTopicTitle] = useState('')
  const [createTopicDescription, setCreateTopicDescription] = useState('')
  const [createTopicLoading, setCreateTopicLoading] = useState(false)
  const [createTopicError, setCreateTopicError] = useState<string | null>(null)
  const [closingTopicId, setClosingTopicId] = useState<number | null>(null)

  const showToast = useCallback((nextToast: ToastMessage, duration = 4000) => {
    setToast(nextToast)
    setTimeout(() => setToast(null), duration)
  }, [])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const result = await fetchTopics()
        const data = result?.data
        if (
          !cancelled &&
          result?.status === 200 &&
          data &&
          typeof data !== 'string' &&
          Array.isArray((data as TopicsResponse).items)
        ) {
          const apiTopics: Topic[] = (data as TopicsResponse).items.map((item) => {
            const authorProfile = deriveAuthorProfile(item.author, '未知')
            return {
              id: item.id,
              title: item.title ?? `话题 ${item.id}`,
              author: authorProfile.name,
              authorTokens: authorProfile.tokens,
              description: item.description ?? '',
              closed: item.closed ?? false,
              likes: item.likes,
              comments: []
            }
          })

          setAllTopics(apiTopics)
        } else if (!cancelled) {
          showToast({ type: 'error', message: '获取话题失败，请稍后再试。' })
        }
      } catch (_) {
        if (!cancelled) {
          showToast({ type: 'error', message: '获取话题失败，请稍后再试。' })
        }
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [showToast])

  const filteredTopics = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return allTopics

    return allTopics.filter((topic) => {
      const matchesTitle = topic.title.toLowerCase().includes(query)
      const matchesId = topic.id.toString().includes(query)
      return matchesTitle || matchesId
    })
  }, [searchTerm, allTopics])

  const selectedTopic =
    selectedTopicId == null ? null : allTopics.find((topic) => topic.id === selectedTopicId) ?? null

  const canCloseSelectedTopic = useMemo(() => {
    if (!currentUser || !selectedTopic) {
      return false
    }

    const topicTokens = new Set(
      (selectedTopic.authorTokens ?? [])
        .map((token) => token.trim().toLowerCase())
        .filter((token) => token.length > 0)
    )

    if (!topicTokens.size) {
      const fallbackToken = normaliseAuthorName(selectedTopic.author, '')
        .trim()
        .toLowerCase()
      if (fallbackToken) {
        topicTokens.add(fallbackToken)
      }
    }

    if (!topicTokens.size) {
      return false
    }

    const userTokens = collectUserTokens(currentUser)
    for (const token of userTokens) {
      if (topicTokens.has(token)) {
        return true
      }
    }

    return false
  }, [currentUser, selectedTopic])

  const isClosingSelectedTopic = selectedTopic ? closingTopicId === selectedTopic.id : false

  useEffect(() => {
    if (selectedTopicId == null) {
      return
    }

    let cancelled = false

    const loadTopicDetail = async (topicId: number) => {
      try {
        const result = await fetchTopicDetail(topicId)
        if (cancelled) {
          return
        }

        if (result.status === 200 && result.data && typeof result.data !== 'string') {
          const detail = result.data as TopicDetailResponse

          setAllTopics((prevTopics) => {
            const fallbackTopic = prevTopics.find((topic) => topic.id === detail.id) ?? null
            const updatedTopic = mergeTopicDetailResponse(detail, fallbackTopic)

            let found = false
            const nextTopics = prevTopics.map((topic) => {
              if (topic.id === updatedTopic.id) {
                found = true
                return updatedTopic
              }
              return topic
            })

            if (!found) {
              return [...nextTopics, updatedTopic]
            }

            return nextTopics
          })
          return
        }

        if (result.status === 404) {
          showToast({ type: 'error', message: '未找到该话题。' })
          setAllTopics((prevTopics) => prevTopics.filter((topic) => topic.id !== topicId))
          return
        }

        showToast({ type: 'error', message: '加载话题详情时出错。' })
      } catch (_) {
        if (!cancelled) {
          showToast({ type: 'error', message: '加载话题详情时出错。' })
        }
      }
    }

    loadTopicDetail(selectedTopicId)

    return () => {
      cancelled = true
    }
  }, [selectedTopicId, showToast])

  const openTopic = (topicId: number) => {
    setSelectedTopicId(topicId)
    setView('topic')
  }

  const goHome = () => {
    setView('home')
    setSelectedTopicId(null)
  }

  const handleHomeClick = () => {
    setSearchTerm('')
    goHome()
  }

  const goToProfile = () => {
    if (!currentUser) {
      setView('login')
      return
    }
    setView('profile')
  }

  const goToLogin = () => {
    if (currentUser) {
      goToProfile()
      return
    }
    setView('login')
  }

  const goToCreateTopic = () => {
    if (!currentUser) {
      showToast({ type: 'info', message: '请先登录后再创建话题。' }, 3000)
      setView('login')
      return
    }
    setCreateTopicTitle('')
    setCreateTopicDescription('')
    setCreateTopicError(null)
    setCreateTopicLoading(false)
    setView('create-topic')
  }

  const goToSignup = () => {
    setView('signup')
  }

  const goToAccountSettings = () => {
    if (!currentUser) {
      setView('login')
      return
    }
    setSettingsLoading(false)
    setSettingsName(currentUser.name ?? '')
    setSettingsPassword('')
    setSettingsConfirmPassword('')
    setView('settings')
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (_) {
      // ignore network errors on logout; still clear local state
    }
    setAuthToken(null)
    setCurrentUser(null)
    persistUserProfile(null)
    goHome()
    showToast({ type: 'success', message: '你已成功退出登录。' }, 3000)
  }

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setView('home')
  }

  const handleSignupSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSignupMessage(null)
    setSignupError(false)

    const email = signupEmail.trim()
    if (!email || !signupPassword) {
      setSignupMessage('请输入邮箱和密码。')
      setSignupError(true)
      return
    }
    if (signupPassword !== signupConfirmPassword) {
      setSignupMessage('两次输入的密码不一致。')
      setSignupError(true)
      return
    }

    setSignupLoading(true)
    try {
      const res = await signup({ email, password: signupPassword })
      const ok =
        res.status >= 200 &&
        res.status < 300 &&
        typeof res.data !== 'string' &&
        (res.data as any)?.status === 'ok'
      setSignupError(!ok)
      const msg =
        typeof res.data === 'string'
          ? res.data
          : ok
          ? '验证邮件已发送到你的 Gmail'
          : (res.data as any)?.message || (res.data as any)?.error || '注册失败。'
      setSignupMessage(msg)
      if (!ok) {
        showToast({ type: 'error', message: msg || '注册失败。' })
      }
      if (ok) {
        showToast({ type: 'success', message: msg })
        setSignupPassword('')
        setSignupConfirmPassword('')
      }
    } catch (e) {
      setSignupError(true)
      setSignupMessage('注册时发生网络错误。')
      showToast({ type: 'error', message: '注册时发生网络错误。' })
    } finally {
      setSignupLoading(false)
    }
  }

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const fd = new FormData(form)
    const email = (fd.get('email') as string | null)?.trim() || ''
    const password = (fd.get('password') as string | null) || ''
    if (!email || !password) {
      showToast({ type: 'error', message: '请输入邮箱和密码。' }, 3000)
      return
    }
    try {
      const res = await login({ email, password })
      const ok =
        res.status >= 200 &&
        res.status < 300 &&
        typeof res.data !== 'string' &&
        (res.data as any)?.status === 'ok'
      if (!ok) {
        const msg =
          typeof res.data === 'string'
            ? res.data
            : (res.data as any)?.message || (res.data as any)?.error || '登录失败。'
        showToast({ type: 'error', message: msg })
        setAuthToken(null)
        persistUserProfile(null)
      } else {
        const payload = res.data as any
        const username = payload?.user?.username ?? payload?.user?.email ?? email ?? '朋友'
        const userEmail = payload?.user?.email ?? email
        const sessionId = payload?.session_id ?? null
        showToast({ type: 'success', message: `欢迎回来，${username}！` }, 3000)
        setAuthToken(sessionId)
        const nextUser: UserProfile = {
          name: username,
          email: userEmail
        }
        setCurrentUser(nextUser)
        persistUserProfile(nextUser)
        goHome()
      }
    } catch (_) {
      showToast({ type: 'error', message: '登录时发生网络错误。' })
    }
  }

  const handleAccountSettingsSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!currentUser) {
      showToast({ type: 'error', message: '请先登录。' })
      return
    }

    const trimmedName = settingsName.trim()
    if (!trimmedName) {
      showToast({ type: 'error', message: '用户名不能为空。' })
      return
    }

    if (settingsPassword || settingsConfirmPassword) {
      if (settingsPassword !== settingsConfirmPassword) {
        showToast({ type: 'error', message: '两次输入的密码不一致。' })
        return
      }
    }

    setSettingsLoading(true)
    try {
      const payload: { email: string; username: string; password?: string } = {
        email: currentUser.email,
        username: trimmedName
      }
      if (settingsPassword) {
        payload.password = settingsPassword
      }

      const res = await updateUser(payload)
      const ok =
        res.status >= 200 &&
        res.status < 300 &&
        typeof res.data !== 'string' &&
        (res.data as any)?.status === 'ok'

      if (!ok) {
        const message =
          typeof res.data === 'string'
            ? res.data
            : (res.data as any)?.message || (res.data as any)?.error || '更新失败。'
        showToast({ type: 'error', message })
        return
      }

      const payloadUser = (res.data as any)?.user
      const updatedName = payloadUser?.username ?? trimmedName
      const updatedEmail = payloadUser?.email ?? currentUser.email
      const nextProfile: UserProfile = {
        name: updatedName,
        email: updatedEmail
      }
      setCurrentUser(nextProfile)
      persistUserProfile(nextProfile)
      setSettingsName(updatedName)
      setSettingsPassword('')
      setSettingsConfirmPassword('')

      const successMessage = payload.password ? '用户名和密码更新成功。' : '用户名更新成功。'
      showToast({ type: 'success', message: successMessage }, 3000)
      setView('profile')
    } catch (_) {
      showToast({ type: 'error', message: '更新账号信息时发生网络错误。' })
    } finally {
      setSettingsLoading(false)
    }
  }

  const userInitial = useMemo(() => {
    if (!currentUser) return null
    const trimmed = currentUser.name?.trim()
    if (trimmed) {
      return trimmed.charAt(0).toUpperCase()
    }
    const emailInitial = currentUser.email?.trim().charAt(0)
    return emailInitial ? emailInitial.toUpperCase() : null
  }, [currentUser])

  const handleCreateTopicSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!currentUser) {
      showToast({ type: 'info', message: '请先登录后再创建话题。' }, 3000)
      setView('login')
      return
    }

    const trimmedTitle = createTopicTitle.trim()
    const trimmedDescription = createTopicDescription.trim()

    if (!trimmedTitle || !trimmedDescription) {
      setCreateTopicError('请填写完整的话题信息。')
      return
    }

    setCreateTopicLoading(true)
    setCreateTopicError(null)

    try {
      const res = await createTopic({ title: trimmedTitle, description: trimmedDescription })
      const ok =
        res.status >= 200 &&
        res.status < 300 &&
        typeof res.data !== 'string' &&
        (res.data as any)?.id != null

      if (!ok) {
        const message =
          typeof res.data === 'string'
            ? res.data
            : (res.data as any)?.message || (res.data as any)?.error || '发布话题失败。'
        setCreateTopicError(message)
        showToast({ type: 'error', message })
        return
      }

      const payload = res.data as any
      const authorProfile = deriveAuthorProfile(
        payload?.author ?? currentUser.name,
        currentUser.name || '我',
        [currentUser.email, currentUser.name]
      )
      const newTopic: Topic = {
        id: payload?.id ?? Date.now(),
        title: payload?.title ?? trimmedTitle,
        author: authorProfile.name,
        authorTokens: authorProfile.tokens,
        description: payload?.description ?? trimmedDescription,
        closed: payload?.closed ?? false,
        likes: payload?.likes,
        comments: []
      }

      setAllTopics((prevTopics) => {
        const filtered = prevTopics.filter((topic) => topic.id !== newTopic.id)
        return [newTopic, ...filtered]
      })

      showToast({ type: 'success', message: '话题发布成功！' }, 3000)

      setCreateTopicTitle('')
      setCreateTopicDescription('')
      setView('topic')
      setSelectedTopicId(newTopic.id)
    } catch (_) {
      const message = '发布话题时发生网络错误。'
      setCreateTopicError(message)
      showToast({ type: 'error', message })
    } finally {
      setCreateTopicLoading(false)
    }
  }

  const handleCancelCreateTopic = () => {
    setCreateTopicTitle('')
    setCreateTopicDescription('')
    setCreateTopicError(null)
    goHome()
  }

  const handleCloseTopic = useCallback(
    async (topicId: number) => {
      if (!currentUser) {
        showToast({ type: 'info', message: '请先登录后再关闭话题。' }, 3000)
        setView('login')
        return
      }

      if (closingTopicId === topicId) {
        return
      }

      setClosingTopicId(topicId)
      try {
        const res = await closeTopic(topicId)
        if (res.status === 200 && res.data && typeof res.data !== 'string') {
          const detail = res.data as TopicDetailResponse
          setAllTopics((prevTopics) => {
            const fallbackTopic = prevTopics.find((topic) => topic.id === topicId) ?? null
            const mergedTopic = mergeTopicDetailResponse(detail, fallbackTopic)
            const finalTopic: Topic = { ...mergedTopic, closed: detail.closed ?? true }

            let updated = false
            const nextTopics = prevTopics.map((topic) => {
              if (topic.id === finalTopic.id) {
                updated = true
                return finalTopic
              }
              return topic
            })

            if (!updated) {
              return [...nextTopics, finalTopic]
            }

            return nextTopics
          })

          showToast({ type: 'success', message: '话题已关闭，新的评论将无法提交。' }, 3000)
          return
        }

        const data = res.data
        let errorMessage =
          res.status === 401
            ? '请先登录后再关闭话题。'
            : res.status === 403
            ? '只有发起人或管理员可以关闭该话题。'
            : res.status === 404
            ? '未找到该话题，无法关闭。'
            : '关闭话题失败，请稍后再试。'

        if (typeof data === 'string' && data.trim()) {
          errorMessage = data
        } else if (data && typeof data === 'object') {
          const message =
            (data as { message?: string; error?: string }).message ??
            (data as { message?: string; error?: string }).error
          if (message) {
            errorMessage = message
          }
        }

        showToast({ type: 'error', message: errorMessage }, 4000)

        if (res.status === 401) {
          setAuthToken(null)
          setCurrentUser(null)
          persistUserProfile(null)
          setView('login')
        }
      } catch (_) {
        showToast({ type: 'error', message: '关闭话题失败，请检查网络连接。' }, 4000)
      } finally {
        setClosingTopicId((prev) => (prev === topicId ? null : prev))
      }
    },
    [closingTopicId, currentUser, showToast]
  )

  return (
    <div className="app">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <TopBar
        onHome={handleHomeClick}
        onLogin={goToLogin}
        onProfile={goToProfile}
        onCreateTopic={goToCreateTopic}
        onSearchSubmit={handleSearchSubmit}
        onSearchTermChange={setSearchTerm}
        searchTerm={searchTerm}
        currentUser={currentUser}
        userInitial={userInitial}
        canCreateTopic={Boolean(currentUser)}
      />

      <main className={`content${view === 'topic' ? ' content--topic' : ''}`} role="main">
        {view === 'home' && <TopicsView topics={filteredTopics} onSelect={openTopic} />}

        {view === 'topic' && selectedTopic && (
          <TopicDetail
            topic={selectedTopic}
            onBack={goHome}
            canCloseTopic={canCloseSelectedTopic && !selectedTopic.closed}
            onCloseTopic={handleCloseTopic}
            closingTopic={isClosingSelectedTopic}
          />
        )}

        {view === 'topic' && !selectedTopic && <TopicNotFound onBack={goHome} />}

        {view === 'login' && <LoginPanel onSubmit={handleLoginSubmit} onSignup={goToSignup} />}

        {view === 'signup' && (
          <SignupPanel
            email={signupEmail}
            password={signupPassword}
            confirmPassword={signupConfirmPassword}
            loading={signupLoading}
            message={signupMessage}
            hasError={signupError}
            onEmailChange={setSignupEmail}
            onPasswordChange={setSignupPassword}
            onConfirmPasswordChange={setSignupConfirmPassword}
            onSubmit={handleSignupSubmit}
            onLoginLink={goToLogin}
          />
        )}

        {view === 'profile' && currentUser && (
          <ProfilePanel
            user={currentUser}
            userInitial={userInitial}
            onAccountSettings={goToAccountSettings}
            onHome={goHome}
            onLogout={handleLogout}
          />
        )}

        {view === 'settings' && currentUser && (
          <AccountSettingsPanel
            name={settingsName}
            password={settingsPassword}
            confirmPassword={settingsConfirmPassword}
            loading={settingsLoading}
            onNameChange={setSettingsName}
            onPasswordChange={setSettingsPassword}
            onConfirmPasswordChange={setSettingsConfirmPassword}
            onSubmit={handleAccountSettingsSubmit}
            onBack={goToProfile}
          />
        )}

        {view === 'create-topic' && currentUser && (
          <CreateTopicPanel
            title={createTopicTitle}
            description={createTopicDescription}
            loading={createTopicLoading}
            error={createTopicError}
            onTitleChange={setCreateTopicTitle}
            onDescriptionChange={setCreateTopicDescription}
            onSubmit={handleCreateTopicSubmit}
            onCancel={handleCancelCreateTopic}
          />
        )}

        {view === 'create-topic' && !currentUser && (
          <LoginPanel onSubmit={handleLoginSubmit} onSignup={goToSignup} />
        )}
      </main>
    </div>
  )
}

export default App

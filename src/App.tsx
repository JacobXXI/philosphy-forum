import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import {
  fetchTopics,
  signup,
  login,
  updateUser,
  TopicsResponse,
  setAuthToken,
  getAuthToken,
  fetchTopicDetail,
  TopicDetailResponse
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

type View = 'home' | 'topic' | 'login' | 'signup' | 'profile' | 'settings'

type ToastState = ToastMessage | null

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
          const apiTopics: Topic[] = (data as TopicsResponse).items.map((item) => ({
            id: item.id,
            title: item.title ?? `话题 ${item.id}`,
            author: item.author ?? '未知',
            description: item.description ?? '',
            comments: []
          }))

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

            const fallbackComments: Topic['comments'] = fallbackTopic?.comments ?? []

            const mappedComments: Topic['comments'] = Array.isArray(detail.comments)
              ? detail.comments.map((comment, index): Topic['comments'][number] => {
                  const backup = fallbackComments[index]
                  const commentBody = comment.content ?? comment.body ?? backup?.body ?? ''
                  const commentCreatedAt =
                    comment.created_at ??
                    comment.createdAt ??
                    backup?.createdAt ??
                    new Date().toISOString()

                  return {
                    id: comment.id ?? backup?.id ?? index,
                    author: comment.author ?? backup?.author ?? '匿名用户',
                    body: commentBody,
                    createdAt: commentCreatedAt
                  }
                })
              : fallbackComments

            const updatedTopic: Topic = {
              id: detail.id,
              title: detail.title ?? fallbackTopic?.title ?? `话题 ${detail.id}`,
              author: detail.author ?? fallbackTopic?.author ?? '未知',
              description: detail.description ?? fallbackTopic?.description ?? '',
              comments: mappedComments
            }

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

  const handleLogout = () => {
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
          ? '账号已创建，现在可以登录。'
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

  return (
    <div className="app">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <TopBar
        onHome={handleHomeClick}
        onLogin={goToLogin}
        onProfile={goToProfile}
        onSearchSubmit={handleSearchSubmit}
        onSearchTermChange={setSearchTerm}
        searchTerm={searchTerm}
        currentUser={currentUser}
        userInitial={userInitial}
      />

      <main className={`content${view === 'topic' ? ' content--topic' : ''}`} role="main">
        {view === 'home' && <TopicsView topics={filteredTopics} onSelect={openTopic} />}

        {view === 'topic' && selectedTopic && <TopicDetail topic={selectedTopic} onBack={goHome} />}

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
      </main>
    </div>
  )
}

export default App

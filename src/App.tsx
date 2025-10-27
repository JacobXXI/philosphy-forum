import { FormEvent, useEffect, useMemo, useState } from 'react'
import './App.css'
import { fetchTopics, signup, login, TopicsResponse } from './request'

type Topic = {
  id: number
  title: string
  author: string
  description: string
}

const exampleTopics: Topic[] = [
  {
    id: 101,
    title: '我们能对任何事物有确定的认知吗？',
    author: '阿米莉亚·沃茨',
    description:
      '在认知总被感知与诠释所中介的世界中，我们如何为确定性的主张辩护？'
  },
  {
    id: 204,
    title: '人工意识的伦理',
    author: '拉维·库尔卡尼',
    description:
      '如果人工智能展现出意识，创造者与使用者需要承担怎样的道德责任？'
  },
  {
    id: 317,
    title: '美、艺术与主观性',
    author: '陈丽娜',
    description:
      '美是否只是见仁见智，抑或我们可以有意义地讨论审美的客观标准？'
  },
  {
    id: 422,
    title: '自由意志的意义',
    author: '加布里埃尔·纳萨尔',
    description:
      '决定论是否削弱我们的能动感，还是自由意志可以与有序的宇宙共存？'
  },
  {
    id: 538,
    title: '共同体、身份与正义',
    author: '玛雅·罗德里格斯',
    description:
      '政治共同体应如何平衡个人权利与彼此之间的责任？'
  }
]

type View = 'home' | 'topic' | 'login' | 'signup' | 'profile' | 'settings'

function App() {
  const [view, setView] = useState<View>('home')
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [allTopics, setAllTopics] = useState<Topic[]>(exampleTopics)
  const [toast, setToast] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>(null)
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null)

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
            const fallback = exampleTopics.find((topic) => topic.id === item.id)
            return {
              id: item.id,
              title: item.title ?? fallback?.title ?? `话题 ${item.id}`,
              author: item.author ?? fallback?.author ?? '未知',
              description: fallback?.description ?? ''
            }
          })

          // Merge API topics with examples by ID; API overrides, but keep example when missing
          const merged = new Map<number, Topic>()
          for (const ex of exampleTopics) merged.set(ex.id, ex)
          for (const api of apiTopics) {
            const existing = merged.get(api.id)
            merged.set(api.id, {
              id: api.id,
              title: api.title ?? existing?.title ?? `话题 ${api.id}`,
              author: api.author ?? existing?.author ?? '未知',
              description: api.description ?? existing?.description ?? ''
            })
          }
          setAllTopics(Array.from(merged.values()))
        } else if (!cancelled) {
          setToast({ type: 'error', message: '获取话题失败，正在显示示例内容。' })
          setTimeout(() => setToast(null), 4000)
        }
      } catch (_) {
        if (!cancelled) {
          setToast({ type: 'error', message: '获取话题失败，正在显示示例内容。' })
          setTimeout(() => setToast(null), 4000)
        }
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

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

  const openTopic = (topicId: number) => {
    setSelectedTopicId(topicId)
    setView('topic')
  }

  const goHome = () => {
    setView('home')
    setSelectedTopicId(null)
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
    setSettingsName(currentUser.name ?? '')
    setSettingsPassword('')
    setSettingsConfirmPassword('')
    setView('settings')
  }

  const handleLogout = () => {
    setCurrentUser(null)
    goHome()
    setToast({ type: 'success', message: '你已成功退出登录。' })
    setTimeout(() => setToast(null), 3000)
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
        setToast({ type: 'error', message: msg || '注册失败。' })
        setTimeout(() => setToast(null), 4000)
      }
      if (ok) {
        setToast({ type: 'success', message: msg })
        setTimeout(() => setToast(null), 4000)
        // Optionally clear fields on success
        setSignupPassword('')
        setSignupConfirmPassword('')
      }
    } catch (e) {
      setSignupError(true)
      setSignupMessage('注册时发生网络错误。')
      setToast({ type: 'error', message: '注册时发生网络错误。' })
      setTimeout(() => setToast(null), 4000)
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
      setToast({ type: 'error', message: '请输入邮箱和密码。' })
      setTimeout(() => setToast(null), 3000)
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
        setToast({ type: 'error', message: msg })
        setTimeout(() => setToast(null), 4000)
      } else {
        const payload = res.data as any
        const username = payload?.user?.username ?? payload?.user?.email ?? email ?? '朋友'
        const userEmail = payload?.user?.email ?? email
        setToast({ type: 'success', message: `欢迎回来，${username}！` })
        setTimeout(() => setToast(null), 3000)
        setCurrentUser({
          name: username,
          email: userEmail
        })
        goHome()
      }
    } catch (_) {
      setToast({ type: 'error', message: '登录时发生网络错误。' })
      setTimeout(() => setToast(null), 4000)
    }
  }

  const handleAccountSettingsSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = settingsName.trim()
    if (!trimmedName) {
      setToast({ type: 'error', message: '用户名不能为空。' })
      setTimeout(() => setToast(null), 4000)
      return
    }

    if (settingsPassword || settingsConfirmPassword) {
      if (settingsPassword !== settingsConfirmPassword) {
        setToast({ type: 'error', message: '两次输入的密码不一致。' })
        setTimeout(() => setToast(null), 4000)
        return
      }
    }

    setCurrentUser((prev) => (prev ? { ...prev, name: trimmedName } : prev))

    const message =
      settingsPassword || settingsConfirmPassword
        ? '用户名和密码更新成功。'
        : '用户名更新成功。'
    setToast({ type: 'success', message })
    setTimeout(() => setToast(null), 3000)
    setView('profile')
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
      {toast && (
        <div
          className={`toast ${toast.type === 'error' ? 'toast--error' : toast.type === 'success' ? 'toast--success' : 'toast--info'}`}
          role="alert"
          aria-live="polite"
        >
          <span className="toast__msg">{toast.message}</span>
          <button className="toast__close" onClick={() => setToast(null)} aria-label="关闭通知">
            ×
          </button>
        </div>
      )}
      <header className="top-bar">
        <button className="logo-button" onClick={goHome}>
          <span className="logo-mark">Φ</span>
          <span className="logo-text">哲学论坛</span>
        </button>

        <form className="search-form" onSubmit={handleSearchSubmit} role="search">
          <label className="visually-hidden" htmlFor="topic-search">
            通过编号或标题搜索话题
          </label>
          <input
            id="topic-search"
            type="search"
            placeholder="通过话题编号或标题搜索"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <button type="submit">搜索</button>
        </form>

        {currentUser ? (
          <button className="profile-chip" type="button" onClick={goToProfile} aria-label="前往个人资料">
            <span className="profile-chip__initial" aria-hidden="true">
              {userInitial ?? '访'}
            </span>
            <span className="profile-chip__name">{currentUser.name}</span>
          </button>
        ) : (
          <button className="login-button" onClick={goToLogin}>
            登录
          </button>
        )}
      </header>

      <main className="content" role="main">
        {view === 'home' && (
          <section className="topics" aria-labelledby="topics-heading">
            <h1 id="topics-heading">讨论话题</h1>
            <p className="topics-subtitle">
              探索社区思想者提出的问题，并分享你的见解。
            </p>

            <ul className="topic-list">
              {filteredTopics.map((topic) => (
                <li key={topic.id} className="topic-card">
                  <div className="topic-card__meta">
                    <span className="topic-id">#{topic.id}</span>
                    <span className="topic-author">作者：{topic.author}</span>
                  </div>
                  <h2>{topic.title}</h2>
                  <p>{topic.description}</p>
                  <button onClick={() => openTopic(topic.id)} className="topic-card__button">
                    查看讨论
                  </button>
                </li>
              ))}

              {filteredTopics.length === 0 && (
                <li className="empty-state">
                  <h2>未找到相关话题</h2>
                  <p>尝试使用不同的标题或编号进行搜索。</p>
                </li>
              )}
            </ul>
          </section>
        )}

        {view === 'topic' && selectedTopic && (
          <article className="topic-detail" aria-labelledby="topic-title">
            <button className="back-link" onClick={goHome}>
              ← 返回所有话题
            </button>
            <header className="topic-detail__header">
              <span className="topic-id detail-id">话题 #{selectedTopic.id}</span>
              <h1 id="topic-title">{selectedTopic.title}</h1>
              <p className="topic-author detail-author">发起人：{selectedTopic.author}</p>
            </header>
            <p className="topic-description">{selectedTopic.description}</p>
          </article>
        )}

        {view === 'topic' && !selectedTopic && (
          <section className="empty-state">
            <h2>未找到该话题</h2>
            <p>你要查看的话题可能已被删除。</p>
            <button onClick={goHome}>返回话题列表</button>
          </section>
        )}

        {view === 'login' && (
          <section className="login-panel" aria-labelledby="login-heading">
            <h1 id="login-heading">欢迎回来</h1>
            <p className="login-subtitle">登录以参与讨论。</p>
            <form className="login-form" onSubmit={handleLoginSubmit}>
              <label htmlFor="email">邮箱</label>
              <input id="email" name="email" type="email" placeholder="you@example.com" />

              <label htmlFor="password">密码</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="请输入密码"
              />

              <button type="submit" className="login-submit">
                登录
              </button>
            </form>
            <p className="signup-prompt" role="note">
              还没有账号？
              <button type="button" className="signup-button" onClick={goToSignup}>
                注册一个账号
              </button>
            </p>
          </section>
        )}

        {view === 'signup' && (
          <section className="signup-panel" aria-labelledby="signup-heading">
            <h1 id="signup-heading">加入讨论</h1>
            <p className="signup-subtitle">
              创建你的论坛账号，与思想伙伴分享观点。
            </p>
            <form className="signup-form" onSubmit={handleSignupSubmit}>
              <label htmlFor="signup-email">邮箱</label>
              <input
                id="signup-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                required
              />

              <label htmlFor="signup-password">密码</label>
              <input
                id="signup-password"
                name="password"
                type="password"
                placeholder="请创建密码"
                autoComplete="new-password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                required
              />

              <label htmlFor="signup-confirm-password">确认密码</label>
              <input
                id="signup-confirm-password"
                name="confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                autoComplete="new-password"
                value={signupConfirmPassword}
                onChange={(e) => setSignupConfirmPassword(e.target.value)}
                required
              />

              <button type="submit" className="signup-submit" disabled={signupLoading}>
                {signupLoading ? '正在创建…' : '创建账号'}
              </button>

              {signupMessage && (
                <p aria-live="polite" className={signupError ? 'error-text' : 'success-text'}>
                  {signupMessage}
                </p>
              )}
            </form>

            <p className="login-prompt" role="note">
              已经拥有账号？
              <button type="button" className="login-link" onClick={goToLogin}>
                前往登录
              </button>
            </p>
          </section>
        )}

        {view === 'profile' && currentUser && (
          <section className="profile-panel" aria-labelledby="profile-heading">
            <header className="profile-header">
              <div className="profile-avatar" aria-hidden="true">
                {userInitial ?? (currentUser.email?.charAt(0).toUpperCase() || '访')}
              </div>
              <div>
                <h1 id="profile-heading">个人资料</h1>
                <p className="profile-subtitle">查看你的账号信息并管理登录状态。</p>
              </div>
            </header>

            <dl className="profile-info">
              <div className="profile-info__row">
                <dt>用户名</dt>
                <dd>{currentUser.name}</dd>
              </div>
              <div className="profile-info__row">
                <dt>邮箱</dt>
                <dd>{currentUser.email}</dd>
              </div>
            </dl>

            <div className="profile-actions">
              <button type="button" className="profile-settings" onClick={goToAccountSettings}>
                修改用户名或密码
              </button>
              <button type="button" className="profile-home" onClick={goHome}>
                返回首页
              </button>
              <button type="button" className="profile-logout" onClick={handleLogout}>
                退出登录
              </button>
            </div>
          </section>
        )}

        {view === 'settings' && currentUser && (
          <section className="account-settings-panel" aria-labelledby="settings-heading">
            <button type="button" className="back-link" onClick={goToProfile}>
              ← 返回个人资料
            </button>
            <h1 id="settings-heading">更新账号信息</h1>
            <p className="account-settings-subtitle">修改显示名称或更新你的登录密码。</p>

            <form className="account-settings-form" onSubmit={handleAccountSettingsSubmit}>
              <label htmlFor="settings-name">用户名</label>
              <input
                id="settings-name"
                name="name"
                type="text"
                value={settingsName}
                onChange={(event) => setSettingsName(event.target.value)}
                placeholder="请输入新的用户名"
                required
              />

              <label htmlFor="settings-password">新密码</label>
              <input
                id="settings-password"
                name="password"
                type="password"
                value={settingsPassword}
                onChange={(event) => setSettingsPassword(event.target.value)}
                placeholder="不修改则留空"
                autoComplete="new-password"
              />

              <label htmlFor="settings-confirm-password">确认新密码</label>
              <input
                id="settings-confirm-password"
                name="confirmPassword"
                type="password"
                value={settingsConfirmPassword}
                onChange={(event) => setSettingsConfirmPassword(event.target.value)}
                placeholder="请再次输入新密码"
                autoComplete="new-password"
              />

              <div className="account-settings-actions">
                <button type="button" className="account-settings-cancel" onClick={goToProfile}>
                  取消
                </button>
                <button type="submit" className="account-settings-submit">
                  保存修改
                </button>
              </div>
            </form>
          </section>
        )}
      </main>
    </div>
  )
}

export default App

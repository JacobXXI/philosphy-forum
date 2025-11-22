import { FormEvent } from 'react'
import { UserProfile } from '../types'
import './TopBar.css'
import PhfLogo from '../assets/Phf-logo.png'

type TopBarProps = {
  onHome: () => void
  onDashboard: () => void
  onLogin: () => void
  onProfile: () => void
  onCreateTopic: () => void
  canCreateTopic: boolean
  onSearchSubmit: (event: FormEvent<HTMLFormElement>) => void
  onSearchTermChange: (value: string) => void
  searchTerm: string
  currentUser: UserProfile | null
  userInitial: string | null
}

export function TopBar({
  onHome,
  onDashboard,
  onLogin,
  onProfile,
  onCreateTopic,
  canCreateTopic,
  onSearchSubmit,
  onSearchTermChange,
  searchTerm,
  currentUser,
  userInitial
}: TopBarProps) {
  return (
    <header className="top-bar">
      <button className="logo-button" onClick={onHome}>
        <img src={PhfLogo} alt="思航" className="logo-mark" />
        <span className="logo-text">思航</span>
      </button>

      <form className="search-form" onSubmit={onSearchSubmit} role="search">
        <label className="visually-hidden" htmlFor="topic-search">
          搜索话题
        </label>
        <input
          id="topic-search"
          type="search"
          placeholder="搜索话题..."
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
        />
      </form>

      <div className="top-bar__actions">
        <button className="dashboard-button" type="button" onClick={onDashboard} aria-label="消息">
          消息
        </button>
        <button
          className="create-topic-button"
          type="button"
          onClick={onCreateTopic}
          aria-label="创建新话题"
          aria-disabled={!canCreateTopic}
          disabled={!canCreateTopic}
        >
          新话题
        </button>

        {currentUser ? (
          <button
            className="profile-chip"
            type="button"
            onClick={onProfile}
            aria-label="打开个人资料"
          >
            <span className="profile-chip__initial" aria-hidden="true">
              {userInitial ?? '？'}
            </span>
            <span className="profile-chip__name">{currentUser.name}</span>
          </button>
        ) : (
          <button className="login-button" type="button" onClick={onLogin}>
            登录
          </button>
        )}
      </div>
    </header>
  )
}

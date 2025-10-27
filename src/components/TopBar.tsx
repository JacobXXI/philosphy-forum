import { FormEvent } from 'react'
import { UserProfile } from '../types'
import './TopBar.css'

type TopBarProps = {
  onHome: () => void
  onLogin: () => void
  onProfile: () => void
  onSearchSubmit: (event: FormEvent<HTMLFormElement>) => void
  onSearchTermChange: (value: string) => void
  searchTerm: string
  currentUser: UserProfile | null
  userInitial: string | null
}

export function TopBar({
  onHome,
  onLogin,
  onProfile,
  onSearchSubmit,
  onSearchTermChange,
  searchTerm,
  currentUser,
  userInitial
}: TopBarProps) {
  return (
    <header className="top-bar">
      <button className="logo-button" onClick={onHome}>
        <span className="logo-mark">Φ</span>
        <span className="logo-text">哲学论坛</span>
      </button>

      <form className="search-form" onSubmit={onSearchSubmit} role="search">
        <label className="visually-hidden" htmlFor="topic-search">
          通过编号或标题搜索话题
        </label>
        <input
          id="topic-search"
          type="search"
          placeholder="通过话题编号或标题搜索"
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
        />
        <button type="submit">搜索</button>
      </form>

      {currentUser ? (
        <button className="profile-chip" type="button" onClick={onProfile} aria-label="前往个人资料">
          <span className="profile-chip__initial" aria-hidden="true">
            {userInitial ?? '访'}
          </span>
          <span className="profile-chip__name">{currentUser.name}</span>
        </button>
      ) : (
        <button className="login-button" onClick={onLogin}>
          登录
        </button>
      )}
    </header>
  )
}

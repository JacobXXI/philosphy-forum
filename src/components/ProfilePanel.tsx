import { UserProfile } from '../types'
import './ProfilePanel.css'

type ProfilePanelProps = {
  user: UserProfile
  userInitial: string | null
  onAccountSettings: () => void
  onHome: () => void
  onLogout: () => void
}

export function ProfilePanel({ user, userInitial, onAccountSettings, onHome, onLogout }: ProfilePanelProps) {
  return (
    <section className="profile-panel" aria-labelledby="profile-heading">
      <header className="profile-header">
        <div className="profile-avatar" aria-hidden="true">
          {userInitial ?? (user.email?.charAt(0).toUpperCase() || '访')}
        </div>
        <div>
          <h1 id="profile-heading">个人资料</h1>
          <p className="profile-subtitle">查看你的账号信息并管理登录状态。</p>
        </div>
      </header>

      <dl className="profile-info">
        <div className="profile-info__row">
          <dt>用户名</dt>
          <dd>{user.name}</dd>
        </div>
        <div className="profile-info__row">
          <dt>邮箱</dt>
          <dd>{user.email}</dd>
        </div>
      </dl>

      <div className="profile-actions">
        <button type="button" className="profile-settings" onClick={onAccountSettings}>
          修改用户名或密码
        </button>
        <button type="button" className="profile-home" onClick={onHome}>
          返回首页
        </button>
        <button type="button" className="profile-logout" onClick={onLogout}>
          退出登录
        </button>
      </div>
    </section>
  )
}

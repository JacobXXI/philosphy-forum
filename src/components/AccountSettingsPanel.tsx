import { FormEvent } from 'react'
import './AccountSettingsPanel.css'

type AccountSettingsPanelProps = {
  name: string
  password: string
  confirmPassword: string
  loading: boolean
  onNameChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onConfirmPasswordChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onBack: () => void
}

export function AccountSettingsPanel({
  name,
  password,
  confirmPassword,
  loading,
  onNameChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  onBack
}: AccountSettingsPanelProps) {
  return (
    <section className="account-settings-panel" aria-labelledby="settings-heading">
      <button type="button" className="back-link" onClick={onBack}>
        ← 返回个人资料
      </button>
      <h1 id="settings-heading">更新账号信息</h1>
      <p className="account-settings-subtitle">修改显示名称或更新你的登录密码。</p>

      <form className="account-settings-form" onSubmit={onSubmit}>
        <label htmlFor="settings-name">用户名</label>
        <input
          id="settings-name"
          name="name"
          type="text"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="请输入新的用户名"
          required
        />

        <label htmlFor="settings-password">新密码</label>
        <input
          id="settings-password"
          name="password"
          type="password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          placeholder="不修改则留空"
          autoComplete="new-password"
        />

        <label htmlFor="settings-confirm-password">确认新密码</label>
        <input
          id="settings-confirm-password"
          name="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(event) => onConfirmPasswordChange(event.target.value)}
          placeholder="请再次输入新密码"
          autoComplete="new-password"
        />

        <div className="account-settings-actions">
          <button type="button" className="account-settings-cancel" onClick={onBack}>
            取消
          </button>
          <button type="submit" className="account-settings-submit" disabled={loading}>
            {loading ? '保存中…' : '保存修改'}
          </button>
        </div>
      </form>
    </section>
  )
}

import { FormEvent } from 'react'
import './LoginPanel.css'

type LoginPanelProps = {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onSignup: () => void
}

export function LoginPanel({ onSubmit, onSignup }: LoginPanelProps) {
  return (
    <section className="login-panel" aria-labelledby="login-heading">
      <h1 id="login-heading">欢迎回来</h1>
      <p className="login-subtitle">登录以参与讨论。</p>
      <form className="login-form" onSubmit={onSubmit}>
        <label htmlFor="email">邮箱</label>
        <input id="email" name="email" type="email" placeholder="you@example.com" />

        <label htmlFor="password">密码</label>
        <input id="password" name="password" type="password" placeholder="请输入密码" />

        <button type="submit" className="login-submit">
          登录
        </button>
      </form>
      <p className="signup-prompt" role="note">
        还没有账号？
        <button type="button" className="signup-button" onClick={onSignup}>
          注册一个账号
        </button>
      </p>
    </section>
  )
}

export type Topic = {
  id: number
  title: string
  author: string
  description: string
}

export type ToastMessage = {
  type: 'error' | 'success' | 'info'
  message: string
}

export type UserProfile = {
  name: string
  email: string
}

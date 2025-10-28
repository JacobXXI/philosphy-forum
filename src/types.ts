export type Comment = {
  id: number
  author: string
  body: string
  createdAt: string
}

export type Topic = {
  id: number
  title: string
  author: string
  description: string
  comments: Comment[]
}

export type ToastMessage = {
  type: 'error' | 'success' | 'info'
  message: string
}

export type UserProfile = {
  name: string
  email: string
}

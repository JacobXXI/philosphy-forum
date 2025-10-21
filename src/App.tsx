import { FormEvent, useMemo, useState } from 'react'
import './App.css'

type Topic = {
  id: number
  title: string
  author: string
  description: string
}

const topics: Topic[] = [
  {
    id: 101,
    title: 'Can we know anything for certain?',
    author: 'Amelia Watts',
    description:
      'How do we justify claims of certainty in a world where knowledge is always mediated by perception and interpretation?'
  },
  {
    id: 204,
    title: 'The ethics of artificial minds',
    author: 'Ravi Kulkarni',
    description:
      'If an artificial intelligence demonstrates consciousness, what moral responsibilities do its creators and users have?'
  },
  {
    id: 317,
    title: 'Beauty, art, and subjectivity',
    author: 'Lina Chen',
    description:
      'Is beauty merely in the eye of the beholder, or can we speak meaningfully about objective standards in aesthetics?'
  },
  {
    id: 422,
    title: 'The meaning of free will',
    author: 'Gabriel Nassar',
    description:
      'Does determinism undermine our sense of agency, or can free will coexist with a lawful universe?'
  },
  {
    id: 538,
    title: 'Community, identity, and justice',
    author: 'Maya Rodríguez',
    description:
      'How should political communities balance individual rights with the responsibilities we owe to one another?'
  }
]

type View = 'home' | 'topic' | 'login'

function App() {
  const [view, setView] = useState<View>('home')
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredTopics = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return topics

    return topics.filter((topic) => {
      const matchesTitle = topic.title.toLowerCase().includes(query)
      const matchesId = topic.id.toString().includes(query)
      return matchesTitle || matchesId
    })
  }, [searchTerm])

  const selectedTopic =
    selectedTopicId == null ? null : topics.find((topic) => topic.id === selectedTopicId) ?? null

  const openTopic = (topicId: number) => {
    setSelectedTopicId(topicId)
    setView('topic')
  }

  const goHome = () => {
    setView('home')
    setSelectedTopicId(null)
  }

  const goToLogin = () => {
    setView('login')
  }

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setView('home')
  }

  return (
    <div className="app">
      <header className="top-bar">
        <button className="logo-button" onClick={goHome}>
          <span className="logo-mark">Φ</span>
          <span className="logo-text">Philosophy Forum</span>
        </button>

        <form className="search-form" onSubmit={handleSearchSubmit} role="search">
          <label className="visually-hidden" htmlFor="topic-search">
            Search topics by ID or title
          </label>
          <input
            id="topic-search"
            type="search"
            placeholder="Search by topic ID or title"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <button type="submit">Search</button>
        </form>

        <button className="login-button" onClick={goToLogin}>
          Log in
        </button>
      </header>

      <main className="content" role="main">
        {view === 'home' && (
          <section className="topics" aria-labelledby="topics-heading">
            <h1 id="topics-heading">Discussion topics</h1>
            <p className="topics-subtitle">
              Explore questions from thinkers across the community and share your perspective.
            </p>

            <ul className="topic-list">
              {filteredTopics.map((topic) => (
                <li key={topic.id} className="topic-card">
                  <div className="topic-card__meta">
                    <span className="topic-id">#{topic.id}</span>
                    <span className="topic-author">By {topic.author}</span>
                  </div>
                  <h2>{topic.title}</h2>
                  <p>{topic.description}</p>
                  <button onClick={() => openTopic(topic.id)} className="topic-card__button">
                    Open discussion
                  </button>
                </li>
              ))}

              {filteredTopics.length === 0 && (
                <li className="empty-state">
                  <h2>No topics found</h2>
                  <p>Try searching by a different title or topic number.</p>
                </li>
              )}
            </ul>
          </section>
        )}

        {view === 'topic' && selectedTopic && (
          <article className="topic-detail" aria-labelledby="topic-title">
            <button className="back-link" onClick={goHome}>
              ← Back to all topics
            </button>
            <header className="topic-detail__header">
              <span className="topic-id detail-id">Topic #{selectedTopic.id}</span>
              <h1 id="topic-title">{selectedTopic.title}</h1>
              <p className="topic-author detail-author">Started by {selectedTopic.author}</p>
            </header>
            <p className="topic-description">{selectedTopic.description}</p>
          </article>
        )}

        {view === 'topic' && !selectedTopic && (
          <section className="empty-state">
            <h2>Topic not found</h2>
            <p>The topic you are looking for may have been removed.</p>
            <button onClick={goHome}>Back to topics</button>
          </section>
        )}

        {view === 'login' && (
          <section className="login-panel" aria-labelledby="login-heading">
            <h1 id="login-heading">Welcome back</h1>
            <p className="login-subtitle">Sign in to join the conversation.</p>
            <form className="login-form">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" placeholder="you@example.com" />

              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
              />

              <button type="submit" className="login-submit">
                Sign in
              </button>
            </form>
            <p className="signup-prompt" role="note">
              New to the forum?
              <button type="button" className="signup-button">
                Create an account
              </button>
            </p>
          </section>
        )}
      </main>
    </div>
  )
}

export default App

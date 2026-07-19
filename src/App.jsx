import { onAuthStateChanged, signOut } from 'firebase/auth'
import {
  ChevronLeft,
  Heart,
  Home,
  ImagePlus,
  LogOut,
  MessageCircleHeart,
  Pencil,
  Plus,
  Send,
  Sparkles,
  UserRoundPlus,
  Users,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { auth, authorizedFetch, signInWithGoogle } from './firebase'

const PERSON_COLORS = ['#FFD7D2', '#FFC6A4', '#FFB7B7', '#D8C2E2', '#C9D9D1']

function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
}

function formatMomentDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function AuthLoading() {
  return (
    <main className="auth-shell" aria-live="polite" aria-busy="true">
      <div className="auth-card auth-loading">
        <img src="/apenas-para-dizer-icon.png" alt="" />
        <span className="spinner" aria-hidden="true" />
        <p>Preparando seu espaço…</p>
      </div>
    </main>
  )
}

function LoginScreen() {
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [authError, setAuthError] = useState('')

  async function handleSignIn() {
    setIsSigningIn(true)
    setAuthError('')

    try {
      await signInWithGoogle()
    } catch (error) {
      if (error.code === 'auth/popup-closed-by-user') {
        setAuthError('A janela de acesso foi fechada antes da conclusão.')
      } else if (error.code === 'auth/popup-blocked') {
        setAuthError('O navegador bloqueou a janela do Google. Libere pop-ups e tente novamente.')
      } else {
        setAuthError('Não foi possível entrar com o Google. Tente novamente.')
      }
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="login-title">
        <div className="auth-brand">
          <img src="/apenas-para-dizer-icon.png" alt="" />
          <div>
            <span>Apenas</span>
            <small>para dizer</small>
          </div>
        </div>

        <div className="auth-copy">
          <p className="eyebrow">Seu espaço particular</p>
          <h1 id="login-title">Entre para guardar o que importa.</h1>
          <p>
            Suas pessoas e mensagens ficam disponíveis somente depois que você
            confirma sua identidade com o Google.
          </p>
        </div>

        <button
          className="google-button"
          type="button"
          disabled={isSigningIn}
          onClick={handleSignIn}
        >
          <span className="google-mark" aria-hidden="true">G</span>
          {isSigningIn ? 'Abrindo o Google…' : 'Continuar com o Google'}
        </button>

        {authError && <p className="auth-error" role="alert">{authError}</p>}
        <p className="auth-note">O acesso é obrigatório para proteger este espaço.</p>
      </section>
    </main>
  )
}

function Avatar({ person, size = 'medium' }) {
  if (person.avatarDataUrl) {
    return (
      <img
        className={`person-avatar person-avatar-${size}`}
        src={person.avatarDataUrl}
        alt=""
      />
    )
  }

  return (
    <span
      className={`person-avatar person-avatar-${size}`}
      style={{ backgroundColor: person.color }}
      aria-hidden="true"
    >
      {initials(person.name)}
    </span>
  )
}

function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><Icon size={26} strokeWidth={1.8} /></span>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  )
}

function HomeScreen({ people, onOpenPerson, onRandomMoment, onShowPeople, recentMoments }) {
  const tapTimers = useRef(new Map())

  useEffect(() => {
    const timers = tapTimers.current
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [])

  function handlePersonTap(person) {
    const pendingTimer = tapTimers.current.get(person.id)

    if (pendingTimer) {
      window.clearTimeout(pendingTimer)
      tapTimers.current.delete(person.id)
      onRandomMoment(person)
      return
    }

    const timer = window.setTimeout(() => {
      tapTimers.current.delete(person.id)
      onOpenPerson(person)
    }, 280)
    tapTimers.current.set(person.id, timer)
  }

  return (
    <>
      <section className="home-hero">
        <p className="eyebrow">Seu círculo</p>
        <h1>Quem veio à sua cabeça hoje?</h1>
        <p>Toque para abrir. Toque duas vezes para escolher uma mensagem.</p>
      </section>

      <section className="people-orbit" aria-labelledby="people-orbit-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Pessoas da sua vida</p>
            <h2 id="people-orbit-title">Por perto</h2>
          </div>
          <button className="text-button" type="button" onClick={onShowPeople}>
            Ver todas
          </button>
        </div>

        {people.length === 0 ? (
          <EmptyState
            icon={UserRoundPlus}
            title="Seu círculo começa com alguém"
            action={
              <button type="button" onClick={onShowPeople}>
                <Plus size={18} /> Adicionar pessoa
              </button>
            }
          >
            Cadastre as pessoas que fazem parte da sua história.
          </EmptyState>
        ) : (
          <div className="avatar-strip">
            {people.map((person) => (
              <div className="avatar-action" key={person.id}>
                <button
                  className="avatar-button"
                  type="button"
                  onClick={() => handlePersonTap(person)}
                  aria-label={`${person.name}. Toque para abrir ou toque duas vezes para escolher uma mensagem.`}
                >
                  <Avatar person={person} size="large" />
                  <strong>{person.name.split(' ')[0]}</strong>
                  <small>{person.messages.length} mensagens</small>
                </button>
                <button
                  className="spark-button"
                  type="button"
                  aria-label={`Escolher uma mensagem para ${person.name}`}
                  onClick={() => onRandomMoment(person)}
                >
                  <Sparkles size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="recent-section" aria-labelledby="recent-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Últimos gestos</p>
            <h2 id="recent-title">O que foi lembrado</h2>
          </div>
        </div>

        {recentMoments.length === 0 ? (
          <EmptyState icon={Heart} title="Ainda está silencioso por aqui">
            Um toque duplo em alguém transforma uma mensagem guardada em um novo momento.
          </EmptyState>
        ) : (
          <div className="moment-list">
            {recentMoments.map(({ person, moment }) => (
              <article className="moment-card" key={moment.id}>
                <Avatar person={person} />
                <div>
                  <p><strong>{person.name}</strong> recebeu uma lembrança</p>
                  <blockquote>“{moment.text}”</blockquote>
                  <small>{formatMomentDate(moment.createdAt)}</small>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  )
}

function PeopleScreen({ people, onCreatePerson, onOpenPerson, isSaving }) {
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [color, setColor] = useState(PERSON_COLORS[0])
  const [avatarDataUrl, setAvatarDataUrl] = useState('')
  const [formError, setFormError] = useState('')

  function handleImageChange(event) {
    const file = event.target.files?.[0]

    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setFormError('Escolha uma imagem JPEG, PNG ou WebP.')
      event.target.value = ''
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setFormError('A imagem deve ter no máximo 2 MB.')
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setAvatarDataUrl(String(reader.result || ''))
      setFormError('')
    }
    reader.onerror = () => setFormError('Não foi possível ler essa imagem.')
    reader.readAsDataURL(file)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!name.trim()) {
      setFormError('Informe o nome da pessoa.')
      return
    }

    setFormError('')
    const created = await onCreatePerson({ name, relationship, color, avatarDataUrl })

    if (created) {
      setName('')
      setRelationship('')
      setColor(PERSON_COLORS[0])
      setAvatarDataUrl('')
    }
  }

  return (
    <>
      <section className="screen-title">
        <p className="eyebrow">Seu círculo</p>
        <h1>Pessoas da minha vida</h1>
        <p>Crie um espaço de mensagens para cada pessoa que importa.</p>
      </section>

      <form className="person-form" onSubmit={handleSubmit}>
        <div className="form-heading">
          <span><UserRoundPlus size={22} /></span>
          <div>
            <p className="eyebrow">Nova pessoa</p>
            <h2>Quem você quer guardar por perto?</h2>
          </div>
        </div>

        <label htmlFor="person-name">Nome</label>
        <input
          id="person-name"
          autoComplete="name"
          maxLength="80"
          placeholder="Ex.: Maria"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />

        <label htmlFor="person-relationship">Como essa pessoa faz parte da sua vida?</label>
        <input
          id="person-relationship"
          maxLength="80"
          placeholder="Ex.: Minha irmã, meu amigo, meu amor"
          value={relationship}
          onChange={(event) => setRelationship(event.target.value)}
        />

        <div className="image-field">
          <span className="field-label">Foto da pessoa <small>(opcional)</small></span>
          <div className="image-upload">
            <Avatar
              person={{ name: name || 'Pessoa', color, avatarDataUrl }}
              size="large"
            />
            <div>
              <label className="upload-button" htmlFor="person-avatar">
                <ImagePlus size={18} />
                {avatarDataUrl ? 'Trocar imagem' : 'Escolher imagem'}
              </label>
              <input
                id="person-avatar"
                className="visually-hidden"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
              />
              <small>JPEG, PNG ou WebP. Máximo de 2 MB.</small>
              {avatarDataUrl && (
                <button
                  className="remove-image-button"
                  type="button"
                  onClick={() => setAvatarDataUrl('')}
                >
                  Remover imagem
                </button>
              )}
            </div>
          </div>
        </div>

        <fieldset className="color-fieldset">
          <legend>Cor do círculo</legend>
          <div>
            {PERSON_COLORS.map((option) => (
              <label className="color-option" key={option}>
                <input
                  type="radio"
                  name="person-color"
                  value={option}
                  checked={color === option}
                  onChange={() => setColor(option)}
                />
                <span style={{ backgroundColor: option }} />
              </label>
            ))}
          </div>
        </fieldset>

        {formError && <p className="inline-error" role="alert">{formError}</p>}

        <button className="primary-button" type="submit" disabled={isSaving}>
          <Plus size={19} />
          {isSaving ? 'Adicionando…' : 'Adicionar ao meu círculo'}
        </button>
      </form>

      <section className="people-list-section" aria-labelledby="people-list-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Já fazem parte</p>
            <h2 id="people-list-title">{people.length} {people.length === 1 ? 'pessoa' : 'pessoas'}</h2>
          </div>
        </div>

        {people.length === 0 ? (
          <EmptyState icon={Users} title="Nenhuma pessoa cadastrada">
            Use o formulário acima para começar seu círculo.
          </EmptyState>
        ) : (
          <div className="people-list">
            {people.map((person) => (
              <button
                className="person-row"
                type="button"
                key={person.id}
                onClick={() => onOpenPerson(person)}
              >
                <Avatar person={person} />
                <span>
                  <strong>{person.name}</strong>
                  <small>{person.relationship || 'Uma pessoa especial'} · {person.messages.length} mensagens</small>
                </span>
                <ChevronLeft className="row-chevron" size={20} aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
      </section>
    </>
  )
}

function PersonScreen({ person, onBack, onAddMessage, onRandomMoment, onUpdatePerson, isSaving }) {
  const [message, setMessage] = useState('')
  const [formError, setFormError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(person.name)
  const [editRelationship, setEditRelationship] = useState(person.relationship)
  const [editColor, setEditColor] = useState(person.color)
  const [editAvatarDataUrl, setEditAvatarDataUrl] = useState(person.avatarDataUrl)
  const [editError, setEditError] = useState('')

  function startEditing() {
    setEditName(person.name)
    setEditRelationship(person.relationship)
    setEditColor(person.color)
    setEditAvatarDataUrl(person.avatarDataUrl)
    setEditError('')
    setIsEditing(true)
  }

  function handleEditImageChange(event) {
    const file = event.target.files?.[0]

    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setEditError('Escolha uma imagem JPEG, PNG ou WebP.')
      event.target.value = ''
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setEditError('A imagem deve ter no máximo 2 MB.')
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setEditAvatarDataUrl(String(reader.result || ''))
      setEditError('')
    }
    reader.onerror = () => setEditError('Não foi possível ler essa imagem.')
    reader.readAsDataURL(file)
  }

  async function handleEditSubmit(event) {
    event.preventDefault()

    if (!editName.trim()) {
      setEditError('Informe o nome da pessoa.')
      return
    }

    setEditError('')
    const updated = await onUpdatePerson(person, {
      name: editName,
      relationship: editRelationship,
      color: editColor,
      avatarDataUrl: editAvatarDataUrl,
    })

    if (updated) setIsEditing(false)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!message.trim()) {
      setFormError('Escreva uma mensagem antes de guardar.')
      return
    }

    setFormError('')
    const saved = await onAddMessage(person, message)

    if (saved) {
      setMessage('')
    }
  }

  return (
    <>
      <button className="back-button" type="button" onClick={onBack}>
        <ChevronLeft size={20} /> Voltar
      </button>

      <section className="person-profile">
        <Avatar person={person} size="profile" />
        <p className="eyebrow">{person.relationship || 'Uma pessoa especial'}</p>
        <h1>{person.name}</h1>
        <p>{person.messages.length} {person.messages.length === 1 ? 'mensagem guardada' : 'mensagens guardadas'}</p>
        <div className="profile-actions">
          <button
            className="surprise-button"
            type="button"
            onClick={() => onRandomMoment(person)}
            disabled={isSaving}
          >
            <Sparkles size={19} />
            {person.messages.length === 0 ? 'Cadastre a primeira mensagem' : 'Escolher uma mensagem agora'}
          </button>
          <button className="edit-person-button" type="button" onClick={startEditing}>
            <Pencil size={18} /> Editar pessoa
          </button>
        </div>
      </section>

      {isEditing && (
        <form className="edit-person-form" onSubmit={handleEditSubmit}>
          <div className="form-heading">
            <span><Pencil size={21} /></span>
            <div>
              <p className="eyebrow">Editar pessoa</p>
              <h2>Atualize o perfil</h2>
            </div>
          </div>

          <label htmlFor="edit-person-name">Nome</label>
          <input
            id="edit-person-name"
            maxLength="80"
            value={editName}
            onChange={(event) => setEditName(event.target.value)}
          />

          <label htmlFor="edit-person-relationship">Como essa pessoa faz parte da sua vida?</label>
          <input
            id="edit-person-relationship"
            maxLength="80"
            value={editRelationship}
            onChange={(event) => setEditRelationship(event.target.value)}
          />

          <div className="image-field">
            <span className="field-label">Foto da pessoa <small>(opcional)</small></span>
            <div className="image-upload">
              <Avatar
                person={{
                  name: editName || 'Pessoa',
                  color: editColor,
                  avatarDataUrl: editAvatarDataUrl,
                }}
                size="large"
              />
              <div>
                <label className="upload-button" htmlFor="edit-person-avatar">
                  <ImagePlus size={18} />
                  {editAvatarDataUrl ? 'Trocar imagem' : 'Escolher imagem'}
                </label>
                <input
                  id="edit-person-avatar"
                  className="visually-hidden"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleEditImageChange}
                />
                <small>JPEG, PNG ou WebP. Máximo de 2 MB.</small>
                {editAvatarDataUrl && (
                  <button
                    className="remove-image-button"
                    type="button"
                    onClick={() => setEditAvatarDataUrl('')}
                  >
                    Remover imagem
                  </button>
                )}
              </div>
            </div>
          </div>

          <fieldset className="color-fieldset">
            <legend>Cor do círculo</legend>
            <div>
              {PERSON_COLORS.map((option) => (
                <label className="color-option" key={option}>
                  <input
                    type="radio"
                    name="edit-person-color"
                    value={option}
                    checked={editColor === option}
                    onChange={() => setEditColor(option)}
                  />
                  <span style={{ backgroundColor: option }} />
                </label>
              ))}
            </div>
          </fieldset>

          {editError && <p className="inline-error" role="alert">{editError}</p>}

          <div className="edit-form-actions">
            <button
              className="cancel-button"
              type="button"
              disabled={isSaving}
              onClick={() => setIsEditing(false)}
            >
              Cancelar
            </button>
            <button className="primary-button" type="submit" disabled={isSaving}>
              {isSaving ? 'Salvando…' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      )}

      <form className="message-form" onSubmit={handleSubmit}>
        <div className="form-heading">
          <span><MessageCircleHeart size={22} /></span>
          <div>
            <p className="eyebrow">Banco de mensagens</p>
            <h2>Guarde algo para dizer</h2>
          </div>
        </div>
        <label htmlFor="person-message">Mensagem para {person.name.split(' ')[0]}</label>
        <textarea
          id="person-message"
          maxLength="280"
          rows="4"
          placeholder="Escreva algo que você gostaria de lembrar de dizer…"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
        <div className="field-meta">
          <span>Ela poderá ser escolhida aleatoriamente depois.</span>
          <span>{message.length}/280</span>
        </div>
        {formError && <p className="inline-error" role="alert">{formError}</p>}
        <button className="primary-button" type="submit" disabled={isSaving}>
          <Send size={18} />
          {isSaving ? 'Guardando…' : 'Guardar mensagem'}
        </button>
      </form>

      <section className="message-bank" aria-labelledby="message-bank-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Repertório</p>
            <h2 id="message-bank-title">Mensagens de {person.name.split(' ')[0]}</h2>
          </div>
        </div>

        {person.messages.length === 0 ? (
          <EmptyState icon={MessageCircleHeart} title="Ainda não há mensagens">
            Cadastre a primeira acima. Depois, um toque duplo poderá escolhê-la para você.
          </EmptyState>
        ) : (
          <div className="saved-message-list">
            {person.messages.map((item, index) => (
              <article className="saved-message" key={item.id}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <p>“{item.text}”</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  )
}

function BottomNavigation({ screen, onNavigate }) {
  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      <button
        type="button"
        className={screen === 'home' ? 'active' : ''}
        aria-current={screen === 'home' ? 'page' : undefined}
        onClick={() => onNavigate('home')}
      >
        <Home size={22} />
        <span>Início</span>
      </button>
      <button
        type="button"
        className={screen === 'people' || screen === 'person' ? 'active' : ''}
        aria-current={screen === 'people' || screen === 'person' ? 'page' : undefined}
        onClick={() => onNavigate('people')}
      >
        <Users size={22} />
        <span>Pessoas</span>
      </button>
    </nav>
  )
}

function AuthenticatedApp({ user }) {
  const [screen, setScreen] = useState('home')
  const [people, setPeople] = useState([])
  const [selectedPersonId, setSelectedPersonId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const selectedPerson = people.find((person) => person.id === selectedPersonId)
  const recentMoments = useMemo(
    () => people
      .flatMap((person) => person.moments.map((moment) => ({ person, moment })))
      .sort((a, b) => new Date(b.moment.createdAt) - new Date(a.moment.createdAt))
      .slice(0, 8),
    [people],
  )

  const showToast = useCallback((message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 4200)
  }, [])

  const loadPeople = useCallback(async () => {
    setError('')

    try {
      const response = await authorizedFetch('/api/people')

      if (!response.ok) {
        throw new Error('Falha ao carregar')
      }

      setPeople(await response.json())
    } catch {
      setError('Não foi possível carregar seu círculo. Confira a conexão e tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPeople()
  }, [loadPeople])

  useEffect(() => {
    function refreshWhenVisible() {
      if (document.visibilityState === 'visible') loadPeople()
    }

    window.addEventListener('focus', loadPeople)
    document.addEventListener('visibilitychange', refreshWhenVisible)

    return () => {
      window.removeEventListener('focus', loadPeople)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [loadPeople])

  function navigate(nextScreen) {
    setScreen(nextScreen)
    if (nextScreen !== 'person') setSelectedPersonId('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openPerson(person) {
    setSelectedPersonId(person.id)
    setScreen('person')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function createPerson(payload) {
    setIsSaving(true)
    setError('')

    try {
      const response = await authorizedFetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error('Falha ao cadastrar')
      const created = await response.json()
      setPeople((current) => [created, ...current])
      showToast(`${created.name} agora faz parte do seu círculo.`)
      return created
    } catch {
      setError('Não foi possível adicionar essa pessoa agora.')
      return null
    } finally {
      setIsSaving(false)
    }
  }

  async function addMessage(person, text) {
    setIsSaving(true)
    setError('')

    try {
      const response = await authorizedFetch(`/api/people/${person.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) throw new Error('Falha ao salvar')
      const updated = await response.json()
      setPeople((current) => current.map((item) => item.id === updated.id ? updated : item))
      showToast(`Mensagem guardada para ${person.name}.`)
      return updated
    } catch {
      setError('Não foi possível guardar essa mensagem agora.')
      return null
    } finally {
      setIsSaving(false)
    }
  }

  async function updatePerson(person, payload) {
    setIsSaving(true)
    setError('')

    try {
      const response = await authorizedFetch(`/api/people/${person.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error('Falha ao atualizar')
      const updated = await response.json()
      setPeople((current) => current.map((item) => item.id === updated.id ? updated : item))
      showToast(`${updated.name} foi atualizado.`)
      return updated
    } catch {
      setError('Não foi possível atualizar essa pessoa agora.')
      return null
    } finally {
      setIsSaving(false)
    }
  }

  async function randomMoment(person) {
    if (person.messages.length === 0) {
      openPerson(person)
      showToast(`Cadastre a primeira mensagem para ${person.name}.`)
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const response = await authorizedFetch(`/api/people/${person.id}/moments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (!response.ok) throw new Error('Falha ao escolher')
      const result = await response.json()
      setPeople((current) => current.map((item) => item.id === result.person.id ? result.person : item))
      showToast(`Para ${person.name}: “${result.moment.text}”`)
      if (navigator.vibrate) navigator.vibrate(12)
    } catch {
      setError('Não foi possível escolher uma mensagem agora.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <button className="brand-button" type="button" onClick={() => navigate('home')}>
          <img src="/apenas-para-dizer-icon.png" alt="" />
          <span>Apenas <small>para dizer</small></span>
        </button>
        <div className="account-actions">
          {user.photoURL ? (
            <img className="user-avatar" src={user.photoURL} alt="" referrerPolicy="no-referrer" />
          ) : (
            <span className="user-avatar user-initial" aria-hidden="true">
              {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
            </span>
          )}
          <button type="button" className="icon-button" onClick={() => signOut(auth)} aria-label="Sair">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="app-content">
        {error && (
          <div className="global-error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={loadPeople}>Tentar novamente</button>
          </div>
        )}

        {isLoading ? (
          <div className="content-loading" aria-live="polite">
            <span className="spinner" aria-hidden="true" />
            <p>Carregando seu círculo…</p>
          </div>
        ) : (
          <>
            {screen === 'home' && (
              <HomeScreen
                people={people}
                recentMoments={recentMoments}
                onOpenPerson={openPerson}
                onRandomMoment={randomMoment}
                onShowPeople={() => navigate('people')}
              />
            )}
            {screen === 'people' && (
              <PeopleScreen
                people={people}
                isSaving={isSaving}
                onCreatePerson={createPerson}
                onOpenPerson={openPerson}
              />
            )}
            {screen === 'person' && selectedPerson && (
              <PersonScreen
                person={selectedPerson}
                isSaving={isSaving}
                onAddMessage={addMessage}
                onBack={() => navigate('people')}
                onRandomMoment={randomMoment}
                onUpdatePerson={updatePerson}
              />
            )}
          </>
        )}
      </main>

      <BottomNavigation screen={screen} onNavigate={navigate} />
      <div className={`toast ${toast ? 'visible' : ''}`} aria-live="polite">
        <Sparkles size={18} />
        <span>{toast}</span>
      </div>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setIsAuthLoading(false)
    })
  }, [])

  if (isAuthLoading) return <AuthLoading />
  if (!user) return <LoginScreen />

  return <AuthenticatedApp user={user} />
}

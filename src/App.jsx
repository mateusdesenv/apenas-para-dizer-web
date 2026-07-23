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
  Share2,
  Sparkles,
  Trash2,
  UserRoundMinus,
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

function LoginScreen({ hasInvitation = false }) {
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
            {hasInvitation
              ? 'Entre com a conta Google que você quer associar a este convite.'
              : 'Suas pessoas e mensagens ficam disponíveis somente depois que você confirma sua identidade com o Google.'}
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

function PeopleScreen({ people, onCreatePerson, onDeletePerson, onInvitePerson, onOpenPerson, onUndoFriendship, isSaving }) {
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
              <div className="person-row-card" key={person.id}>
                <button
                  className="person-row"
                  type="button"
                  onClick={() => onOpenPerson(person)}
                >
                  <Avatar person={person} />
                  <span>
                    <strong>{person.name}</strong>
                    <small>{person.relationship || 'Uma pessoa especial'} · {person.messages.length} mensagens</small>
                  </span>
                  <ChevronLeft className="row-chevron" size={20} aria-hidden="true" />
                </button>
                <button
                  className="person-invite-button"
                  type="button"
                  disabled={isSaving || person.isLinked}
                  onClick={() => onInvitePerson(person)}
                >
                  <Share2 size={16} />
                  {person.isLinked ? 'Conta conectada' : 'Convidar para o app'}
                </button>
                <button
                  className="person-danger-button"
                  type="button"
                  disabled={isSaving}
                  onClick={() => person.isLinked ? onUndoFriendship(person) : onDeletePerson(person)}
                >
                  {person.isLinked ? <UserRoundMinus size={16} /> : <Trash2 size={16} />}
                  {person.isLinked ? 'Desfazer amizade' : 'Excluir pessoa'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}

function PersonScreen({
  person,
  momentHistory,
  isHistoryLoading,
  historyError,
  onBack,
  onAddMessage,
  onDeletePerson,
  onInvitePerson,
  onRandomMoment,
  onRetryHistory,
  onUndoFriendship,
  onUpdatePerson,
  isSaving,
}) {
  const [messageTitle, setMessageTitle] = useState('')
  const [messageDescription, setMessageDescription] = useState('')
  const [messageType, setMessageType] = useState('moment')
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

    if (!messageTitle.trim()) {
      setFormError('Informe o título da mensagem.')
      return
    }

    if (!messageDescription.trim()) {
      setFormError('Escreva a descrição da mensagem.')
      return
    }

    setFormError('')
    const saved = await onAddMessage(person, {
      type: messageType,
      title: messageTitle,
      description: messageDescription,
    })

    if (saved) {
      setMessageTitle('')
      setMessageDescription('')
      setMessageType('moment')
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
          <button
            className="invite-person-button"
            type="button"
            disabled={isSaving}
            onClick={() => onInvitePerson(person)}
          >
            <Share2 size={18} />
            {person.isLinked ? 'Conta conectada' : 'Convidar para o app'}
          </button>
          <button
            className="delete-person-button"
            type="button"
            disabled={isSaving}
            onClick={() => person.isLinked ? onUndoFriendship(person) : onDeletePerson(person)}
          >
            {person.isLinked ? <UserRoundMinus size={18} /> : <Trash2 size={18} />}
            {person.isLinked ? 'Desfazer amizade' : 'Excluir pessoa'}
          </button>
        </div>
      </section>

      <section className="moment-history" aria-labelledby="moment-history-title" aria-busy={isHistoryLoading}>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Nossa história</p>
            <h2 id="moment-history-title">Momentos entre vocês</h2>
          </div>
          {!isHistoryLoading && !historyError && (
            <span className="history-count" aria-label={`${momentHistory.length} momentos`}>
              {momentHistory.length}
            </span>
          )}
        </div>

        {isHistoryLoading ? (
          <div className="history-status" aria-live="polite">
            <span className="spinner" aria-hidden="true" />
            <p>Carregando os momentos de vocês…</p>
          </div>
        ) : historyError ? (
          <div className="history-error" role="alert">
            <p>{historyError}</p>
            <button className="secondary-button" type="button" onClick={onRetryHistory}>
              Tentar novamente
            </button>
          </div>
        ) : momentHistory.length === 0 ? (
          <EmptyState icon={Heart} title="Ainda não há momentos entre vocês">
            Quando um de vocês enviar um momento, ele aparecerá aqui.
          </EmptyState>
        ) : (
          <div className="moment-history-list">
            {momentHistory.map((moment) => (
              <article
                className={`history-moment history-moment-${moment.direction}`}
                key={`${moment.direction}-${moment.id}`}
              >
                <div className="history-moment-meta">
                  <strong>
                    {moment.direction === 'sent'
                      ? `Você enviou para ${person.name.split(' ')[0]}`
                      : `${person.name.split(' ')[0]} enviou para você`}
                  </strong>
                  <time dateTime={moment.createdAt}>{formatMomentDate(moment.createdAt)}</time>
                </div>
                <p>“{moment.text}”</p>
              </article>
            ))}
          </div>
        )}
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
        <fieldset className="message-type-fieldset">
          <legend>Tipo de mensagem</legend>
          <div className="message-type-options">
            <label className={messageType === 'moment' ? 'message-type-option is-selected' : 'message-type-option'}>
              <input
                type="radio"
                name="message-type"
                value="moment"
                checked={messageType === 'moment'}
                onChange={(event) => setMessageType(event.target.value)}
              />
              <span>
                <strong>Mensagem de momento</strong>
                <small>Pode aparecer quando você escolher uma mensagem para este momento.</small>
              </span>
            </label>
            <label className={messageType === 'special' ? 'message-type-option is-selected' : 'message-type-option'}>
              <input
                type="radio"
                name="message-type"
                value="special"
                checked={messageType === 'special'}
                onChange={(event) => setMessageType(event.target.value)}
              />
              <span>
                <strong>Mensagem especial</strong>
                <small>Só {person.name.split(' ')[0]} poderá ver, depois que entrar na conexão com você.</small>
              </span>
            </label>
          </div>
        </fieldset>
        <label htmlFor="person-message-title">Título</label>
        <input
          id="person-message-title"
          maxLength="40"
          placeholder="Ex.: Quando você precisar de coragem"
          value={messageTitle}
          onChange={(event) => setMessageTitle(event.target.value)}
        />
        <div className="field-meta field-meta-counter">
          <span>Uma frase curta para identificar a mensagem.</span>
          <span>{messageTitle.length}/40</span>
        </div>
        <label htmlFor="person-message">Descrição para {person.name.split(' ')[0]}</label>
        <textarea
          id="person-message"
          maxLength="250"
          rows="4"
          placeholder="Escreva algo que você gostaria de lembrar de dizer…"
          value={messageDescription}
          onChange={(event) => setMessageDescription(event.target.value)}
        />
        <div className="field-meta">
          <span>
            {messageType === 'moment'
              ? 'Ela poderá ser escolhida aleatoriamente depois.'
              : 'Ela ficará guardada até essa pessoa entrar na sua conexão.'}
          </span>
          <span>{messageDescription.length}/250</span>
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
                <div>
                  <small className={`message-type-badge message-type-badge-${item.type || 'moment'}`}>
                    {(item.type || 'moment') === 'special' ? 'Especial' : 'Momento'}
                  </small>
                  <h3>{item.title || 'Mensagem'}</h3>
                  <p>“{item.description || item.text}”</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  )
}

function ReceivedMessagesScreen({ messages, isLoading, error, onRetry }) {
  return (
    <>
      <section className="screen-title received-screen-title">
        <p className="eyebrow">Sua caixa de entrada</p>
        <h1>Mensagens que chegaram até você</h1>
        <p>Um lugar para reler tudo o que as pessoas quiseram guardar para você.</p>
      </section>

      <section className="received-messages" aria-labelledby="received-messages-title" aria-busy={isLoading}>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Recebidas</p>
            <h2 id="received-messages-title">
              {messages.length} {messages.length === 1 ? 'mensagem' : 'mensagens'}
            </h2>
          </div>
        </div>

        {isLoading ? (
          <div className="content-loading" aria-live="polite">
            <span className="spinner" aria-hidden="true" />
            <p>Buscando suas mensagens…</p>
          </div>
        ) : error ? (
          <div className="received-error" role="alert">
            <MessageCircleHeart size={24} aria-hidden="true" />
            <div>
              <strong>Não foi possível abrir sua caixa de entrada.</strong>
              <p>{error}</p>
            </div>
            <button type="button" onClick={onRetry}>Tentar novamente</button>
          </div>
        ) : messages.length === 0 ? (
          <EmptyState icon={MessageCircleHeart} title="Ainda não chegou nenhuma mensagem">
            Quando alguém guardar algo para você, a mensagem aparecerá aqui.
          </EmptyState>
        ) : (
          <div className="received-message-list">
            {messages.map((message) => {
              const sender = message.sender || {}
              const senderName = sender.displayName || sender.name || message.senderName || 'Alguém especial'
              const senderAvatar = sender.photoURL || sender.avatarDataUrl || message.senderPhotoURL

              return (
                <article className="received-message-card" key={message.id}>
                  {senderAvatar ? (
                    <img className="received-sender-avatar" src={senderAvatar} alt="" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="received-sender-avatar received-sender-fallback" aria-hidden="true">
                      {initials(senderName)}
                    </span>
                  )}
                  <div className="received-message-body">
                    <div className="received-message-meta">
                      <strong>{senderName}</strong>
                      {message.createdAt && <time dateTime={message.createdAt}>{formatMomentDate(message.createdAt)}</time>}
                    </div>
                    {message.title && <h3>{message.title}</h3>}
                    <blockquote>“{message.description || message.text}”</blockquote>
                  </div>
                </article>
              )
            })}
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
        className={screen === 'received' ? 'active' : ''}
        aria-current={screen === 'received' ? 'page' : undefined}
        onClick={() => onNavigate('received')}
      >
        <MessageCircleHeart size={22} />
        <span>Recebidas</span>
      </button>
      <button
        type="button"
        className={screen === 'friends' ? 'active' : ''}
        aria-current={screen === 'friends' ? 'page' : undefined}
        onClick={() => onNavigate('friends')}
      >
        <UserRoundPlus size={22} />
        <span>Amigos</span>
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

function SocialAvatar({ profile }) {
  if (profile?.photoURL) {
    return <img className="social-avatar" src={profile.photoURL} alt="" referrerPolicy="no-referrer" />
  }
  return <span className="social-avatar social-avatar-fallback" aria-hidden="true">{initials(profile?.displayName || 'U')}</span>
}

function FriendsScreen({ profile, requests, isSaving, onSaveUsername, onSearch, onSendRequest, onRespond }) {
  const [username, setUsername] = useState(profile?.username || '')
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [formError, setFormError] = useState('')

  useEffect(() => setUsername(profile?.username || ''), [profile?.username])

  async function handleUsernameSubmit(event) {
    event.preventDefault()
    setFormError('')
    await onSaveUsername(username)
  }

  async function handleSearch(event) {
    event.preventDefault()
    if (search.trim().replace(/^@/, '').length < 2) {
      setFormError('Digite pelo menos 2 caracteres para buscar.')
      return
    }
    setFormError('')
    setResults(await onSearch(search))
  }

  const incoming = requests.filter((request) => request.direction === 'incoming' && request.status === 'pending')
  const outgoing = requests.filter((request) => request.direction === 'outgoing' && request.status === 'pending')

  return (
    <>
      <section className="screen-title social-screen-title">
        <p className="eyebrow">Sua rede</p>
        <h1>Amigos</h1>
        <p>Encontre quem já usa o app e conecte os perfis de vocês.</p>
      </section>

      <div className="social-grid">
        <form className="social-panel" onSubmit={handleUsernameSubmit}>
          <div className="social-panel-heading">
            <span><UserRoundPlus size={21} /></span>
            <div>
              <p className="eyebrow">Seu perfil</p>
              <h2>Nome de usuário</h2>
            </div>
          </div>
          <p className="social-description">É assim que seus amigos encontrarão você.</p>
          <label htmlFor="social-username">Seu @username</label>
          <div className="username-field">
            <span aria-hidden="true">@</span>
            <input
              id="social-username"
              autoCapitalize="none"
              autoComplete="username"
              maxLength="24"
              pattern="[A-Za-z0-9._]{3,24}"
              required
              placeholder="seu.usuario"
              value={username}
              onChange={(event) => setUsername(event.target.value.replace(/^@/, ''))}
            />
          </div>
          <small className="field-help">3 a 24 caracteres: letras, números, ponto ou sublinhado.</small>
          <button className="primary-button" type="submit" disabled={isSaving}>
            {profile?.username ? 'Salvar @username' : 'Criar @username'}
          </button>
        </form>

        <form className="social-panel" onSubmit={handleSearch}>
          <div className="social-panel-heading">
            <span><Users size={21} /></span>
            <div>
              <p className="eyebrow">Nova conexão</p>
              <h2>Adicionar um amigo</h2>
            </div>
          </div>
          <p className="social-description">Busque pelo nome de usuário exato ou pelo começo dele.</p>
          <label htmlFor="friend-search">Nome de usuário</label>
          <div className="social-search-row">
            <input
              id="friend-search"
              autoCapitalize="none"
              autoComplete="off"
              placeholder="@MatheusC2001"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button type="submit" disabled={isSaving}>Buscar</button>
          </div>
          {formError && <p className="inline-error" role="alert">{formError}</p>}
          <div className="social-results" aria-live="polite">
            {results.map((result) => (
              <article className="social-user-card" key={result.username}>
                <SocialAvatar profile={result} />
                <div>
                  <strong>{result.displayName}</strong>
                  <small>@{result.username}</small>
                </div>
                <button
                  type="button"
                  disabled={isSaving || !result.username}
                  onClick={async () => {
                    if (await onSendRequest(result.username)) {
                      setResults((current) => current.filter((item) => item.username !== result.username))
                    }
                  }}
                >
                  Adicionar
                </button>
              </article>
            ))}
          </div>
        </form>
      </div>

      {incoming.length > 0 && (
        <section className="social-panel social-requests" aria-labelledby="incoming-title">
          <p className="eyebrow">Novas conexões</p>
          <h2 id="incoming-title">Pedidos recebidos</h2>
          <div className="request-list">
            {incoming.map((request) => (
              <article className="request-card" key={request.id}>
                <SocialAvatar profile={request.profile} />
                <div>
                  <strong>{request.profile?.displayName || 'Usuário'}</strong>
                  <small>@{request.profile?.username || 'sem-username'}</small>
                </div>
                <div className="request-actions">
                  <button className="secondary-button" type="button" disabled={isSaving} onClick={() => onRespond(request, 'reject')}>Recusar</button>
                  <button type="button" disabled={isSaving} onClick={() => onRespond(request, 'accept')}>Aceitar</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {outgoing.length > 0 && (
        <section className="social-panel social-requests" aria-labelledby="outgoing-title">
          <p className="eyebrow">Aguardando resposta</p>
          <h2 id="outgoing-title">Pedidos enviados</h2>
          <div className="request-list">
            {outgoing.map((request) => (
              <article className="request-card request-card-pending" key={request.id}>
                <SocialAvatar profile={request.profile} />
                <div>
                  <strong>{request.profile?.displayName || 'Usuário'}</strong>
                  <small>@{request.profile?.username || 'sem-username'}</small>
                </div>
                <span className="status-badge">Pendente</span>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
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
  const [socialProfile, setSocialProfile] = useState(null)
  const [friendRequests, setFriendRequests] = useState([])
  const [receivedMessages, setReceivedMessages] = useState([])
  const [receivedMessagesError, setReceivedMessagesError] = useState('')
  const [isLoadingReceivedMessages, setIsLoadingReceivedMessages] = useState(true)
  const [momentHistories, setMomentHistories] = useState({})
  const [historyLoadingId, setHistoryLoadingId] = useState('')
  const [historyErrors, setHistoryErrors] = useState({})

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

  const loadSocial = useCallback(async () => {
    try {
      const [profileResponse, requestsResponse] = await Promise.all([
        authorizedFetch('/api/social/me'),
        authorizedFetch('/api/social/friend-requests'),
      ])
      const profileBody = await profileResponse.json()
      const requestsBody = await requestsResponse.json()
      if (!profileResponse.ok) throw new Error(profileBody.error || 'Não foi possível carregar seu perfil.')
      if (!requestsResponse.ok) throw new Error(requestsBody.error || 'Não foi possível carregar suas solicitações.')
      setSocialProfile(profileBody)
      setFriendRequests(requestsBody)
    } catch (socialError) {
      setError(socialError instanceof Error ? socialError.message : 'Não foi possível carregar sua rede.')
    }
  }, [])

  const loadReceivedMessages = useCallback(async () => {
    setReceivedMessagesError('')
    setIsLoadingReceivedMessages(true)

    try {
      const response = await authorizedFetch('/api/messages/received')
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Tente novamente em alguns instantes.')
      setReceivedMessages(Array.isArray(body) ? body : body.messages || [])
    } catch (receivedError) {
      setReceivedMessagesError(
        receivedError instanceof Error ? receivedError.message : 'Tente novamente em alguns instantes.',
      )
    } finally {
      setIsLoadingReceivedMessages(false)
    }
  }, [])

  useEffect(() => {
    loadPeople()
    loadSocial()
    loadReceivedMessages()
  }, [loadPeople, loadReceivedMessages, loadSocial])

  useEffect(() => {
    function refreshWhenVisible() {
      if (document.visibilityState === 'visible') {
        loadPeople()
        loadSocial()
        loadReceivedMessages()
      }
    }

    function refreshAll() {
      loadPeople()
      loadSocial()
      loadReceivedMessages()
    }

    window.addEventListener('focus', refreshAll)
    document.addEventListener('visibilitychange', refreshWhenVisible)

    return () => {
      window.removeEventListener('focus', refreshAll)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [loadPeople, loadReceivedMessages, loadSocial])

  function navigate(nextScreen) {
    setScreen(nextScreen)
    if (nextScreen !== 'person') setSelectedPersonId('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const loadMomentHistory = useCallback(async (personId) => {
    setHistoryLoadingId(personId)
    setHistoryErrors((current) => ({ ...current, [personId]: '' }))

    try {
      const response = await authorizedFetch(`/api/people/${personId}/moments`)
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Falha ao carregar os momentos.')
      setMomentHistories((current) => ({
        ...current,
        [personId]: Array.isArray(body) ? body : [],
      }))
    } catch {
      setHistoryErrors((current) => ({
        ...current,
        [personId]: 'Não foi possível carregar os momentos de vocês agora.',
      }))
    } finally {
      setHistoryLoadingId((current) => current === personId ? '' : current)
    }
  }, [])

  function openPerson(person) {
    setSelectedPersonId(person.id)
    setScreen('person')
    loadMomentHistory(person.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function saveUsername(username) {
    setIsSaving(true)
    setError('')
    try {
      const response = await authorizedFetch('/api/social/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Não foi possível salvar seu nome de usuário.')
      setSocialProfile(body)
      showToast(`Seu nome agora é @${body.username}.`)
      return true
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível salvar seu nome de usuário.')
      return false
    } finally {
      setIsSaving(false)
    }
  }

  async function searchUsers(username) {
    setError('')
    try {
      const query = encodeURIComponent(username.trim().replace(/^@/, ''))
      const response = await authorizedFetch(`/api/social/users/search?username=${query}`)
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Não foi possível buscar usuários.')
      return body
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : 'Não foi possível buscar usuários.')
      return []
    }
  }

  async function sendFriendRequest(username) {
    setIsSaving(true)
    setError('')
    try {
      const response = await authorizedFetch('/api/social/friend-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Não foi possível enviar a solicitação.')
      await loadSocial()
      showToast(`Solicitação enviada para @${username}.`)
      return true
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível enviar a solicitação.')
      return false
    } finally {
      setIsSaving(false)
    }
  }

  async function respondToFriendRequest(request, action) {
    setIsSaving(true)
    setError('')
    try {
      const response = await authorizedFetch(`/api/social/friend-requests/${request.id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Não foi possível responder à solicitação.')
      await Promise.all([loadSocial(), loadPeople()])
      showToast(action === 'accept' ? 'Amizade adicionada ao seu círculo.' : 'Solicitação recusada.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível responder à solicitação.')
    } finally {
      setIsSaving(false)
    }
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

  async function addMessage(person, message) {
    setIsSaving(true)
    setError('')

    try {
      const response = await authorizedFetch(`/api/people/${person.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
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

  async function deletePerson(person) {
    if (!window.confirm(`Excluir ${person.name} e todas as mensagens e momentos guardados para essa pessoa?`)) return false

    setIsSaving(true)
    setError('')
    try {
      const response = await authorizedFetch(`/api/people/${person.id}`, { method: 'DELETE' })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Não foi possível excluir essa pessoa.')
      setPeople((current) => current.filter((item) => item.id !== person.id))
      if (selectedPersonId === person.id) navigate('people')
      showToast(`${person.name} foi removido do seu círculo.`)
      return true
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Não foi possível excluir essa pessoa.')
      return false
    } finally {
      setIsSaving(false)
    }
  }

  async function undoFriendship(person) {
    if (!window.confirm(`Desfazer a amizade com ${person.name}? As mensagens guardadas serão preservadas.`)) return false

    setIsSaving(true)
    setError('')
    try {
      const response = await authorizedFetch(`/api/people/${person.id}/friendship`, { method: 'DELETE' })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Não foi possível desfazer a amizade.')
      setPeople((current) => current.map((item) => item.id === body.person.id ? body.person : item))
      showToast(`A amizade com ${person.name} foi desfeita.`)
      return true
    } catch (friendshipError) {
      setError(friendshipError instanceof Error ? friendshipError.message : 'Não foi possível desfazer a amizade.')
      return false
    } finally {
      setIsSaving(false)
    }
  }

  async function invitePerson(person) {
    setIsSaving(true)
    setError('')

    try {
      const response = await authorizedFetch(`/api/people/${person.id}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const invitation = await response.json()
      if (!response.ok) throw new Error(invitation.error || 'Falha ao gerar convite')

      const shareData = {
        title: `Convite para ${person.name}`,
        text: `Oi, ${person.name.split(' ')[0]}! Quero te convidar para o Apenas para dizer.`,
        url: invitation.inviteUrl,
      }
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(invitation.inviteUrl)
        showToast('Link do convite copiado.')
      }
    } catch (inviteError) {
      if (inviteError?.name !== 'AbortError') {
        setError(inviteError instanceof Error ? inviteError.message : 'Não foi possível gerar o convite agora.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  async function randomMoment(person) {
    const momentMessages = person.messages.filter((message) => (
      !message.type || message.type === 'moment'
    ))
    if (momentMessages.length === 0) {
      openPerson(person)
      showToast(`Cadastre a primeira mensagem de momento para ${person.name}.`)
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
      await loadMomentHistory(person.id)
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
                onDeletePerson={deletePerson}
                onInvitePerson={invitePerson}
                onOpenPerson={openPerson}
                onUndoFriendship={undoFriendship}
              />
            )}
            {screen === 'person' && selectedPerson && (
              <PersonScreen
                person={selectedPerson}
                momentHistory={momentHistories[selectedPerson.id] || []}
                isHistoryLoading={historyLoadingId === selectedPerson.id}
                historyError={historyErrors[selectedPerson.id] || ''}
                isSaving={isSaving}
                onAddMessage={addMessage}
                onBack={() => navigate('people')}
                onDeletePerson={deletePerson}
                onInvitePerson={invitePerson}
                onRandomMoment={randomMoment}
                onRetryHistory={() => loadMomentHistory(selectedPerson.id)}
                onUndoFriendship={undoFriendship}
                onUpdatePerson={updatePerson}
              />
            )}
            {screen === 'friends' && (
              <FriendsScreen
                profile={socialProfile}
                requests={friendRequests}
                isSaving={isSaving}
                onSaveUsername={saveUsername}
                onSearch={searchUsers}
                onSendRequest={sendFriendRequest}
                onRespond={respondToFriendRequest}
              />
            )}
            {screen === 'received' && (
              <ReceivedMessagesScreen
                messages={receivedMessages}
                isLoading={isLoadingReceivedMessages}
                error={receivedMessagesError}
                onRetry={loadReceivedMessages}
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
  const [invitationStatus, setInvitationStatus] = useState('idle')
  const [invitationError, setInvitationError] = useState('')
  const invitationToken = useMemo(
    () => new URLSearchParams(window.location.search).get('invite'),
    [],
  )
  const acceptedInvitation = useRef('')

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setIsAuthLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!user || !invitationToken || acceptedInvitation.current === invitationToken) return

    acceptedInvitation.current = invitationToken
    setInvitationStatus('accepting')
    authorizedFetch('/api/social/me')
      .then((profileResponse) => {
        if (!profileResponse.ok) throw new Error('Não foi possível preparar seu perfil.')
        return authorizedFetch(`/api/invitations/${encodeURIComponent(invitationToken)}/accept`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
      })
      .then(async (response) => {
        const body = await response.json()
        if (!response.ok) throw new Error(body.error || 'Não foi possível aceitar o convite.')
        window.history.replaceState({}, '', window.location.pathname)
        setInvitationStatus('accepted')
      })
      .catch((error) => {
        setInvitationError(error instanceof Error ? error.message : 'Não foi possível aceitar o convite.')
        setInvitationStatus('error')
      })
  }, [invitationToken, user])

  if (isAuthLoading) return <AuthLoading />
  if (!user) return <LoginScreen hasInvitation={Boolean(invitationToken)} />
  if (invitationStatus === 'accepting') return <AuthLoading />
  if (invitationStatus === 'error') {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <div className="auth-copy">
            <p className="eyebrow">Convite</p>
            <h1>Não foi possível associar sua conta.</h1>
            <p className="auth-error" role="alert">{invitationError}</p>
          </div>
          <button type="button" onClick={() => setInvitationStatus('accepted')}>
            Continuar para o app
          </button>
        </section>
      </main>
    )
  }

  return <AuthenticatedApp user={user} />
}

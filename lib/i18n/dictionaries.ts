export type Locale = 'en' | 'es' | 'fr' | 'pt' | 'zh'

export const LOCALES: { code: Locale; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
  { code: 'fr', label: 'FR' },
  { code: 'pt', label: 'PT' },
  { code: 'zh', label: '中文' },
]

export type DictKey =
  | 'placeholder'
  | 'search_prompt'
  | 'formal_label'
  | 'slang_label'
  | 'no_formal'
  | 'no_slang'
  | 'error'
  | 'did_you_mean'
  | 'definitions_in_english'
  | 'nsfw_notice'
  | 'nsfw_dismiss'
  | 'play_audio'
  | 'open_on_ud'
  | 'language'
  | 'mw_rate_limited'

type Dictionary = Record<DictKey, string>

export const dictionaries: Record<Locale, Dictionary> = {
  en: {
    placeholder: 'Look up a word…',
    search_prompt: 'Type a word and press enter.',
    formal_label: 'Formal',
    slang_label: 'Slang',
    no_formal: 'No Merriam-Webster entry.',
    no_slang: 'No Urban Dictionary entry.',
    error: 'Something went wrong. Try again.',
    did_you_mean: 'Did you mean…',
    definitions_in_english: 'Definitions are in English. Slang from Urban Dictionary — may be explicit.',
    nsfw_notice: 'Urban Dictionary results may include explicit or offensive content.',
    nsfw_dismiss: 'Got it',
    play_audio: 'Play pronunciation',
    open_on_ud: 'Open on Urban Dictionary',
    language: 'Language',
    mw_rate_limited: 'Daily Merriam-Webster limit reached — formal definitions will be back tomorrow.',
  },
  es: {
    placeholder: 'Busca una palabra…',
    search_prompt: 'Escribe una palabra y presiona enter.',
    formal_label: 'Formal',
    slang_label: 'Jerga',
    no_formal: 'Sin entrada de Merriam-Webster.',
    no_slang: 'Sin entrada de Urban Dictionary.',
    error: 'Algo salió mal. Inténtalo de nuevo.',
    did_you_mean: '¿Quisiste decir…?',
    definitions_in_english: 'Las definiciones están en inglés. La jerga proviene de Urban Dictionary y puede ser explícita.',
    nsfw_notice: 'Los resultados de Urban Dictionary pueden contener contenido explícito u ofensivo.',
    nsfw_dismiss: 'Entendido',
    play_audio: 'Reproducir pronunciación',
    open_on_ud: 'Abrir en Urban Dictionary',
    language: 'Idioma',
    mw_rate_limited: 'Límite diario de Merriam-Webster alcanzado — las definiciones formales volverán mañana.',
  },
  fr: {
    placeholder: 'Cherchez un mot…',
    search_prompt: 'Tapez un mot et appuyez sur entrée.',
    formal_label: 'Formel',
    slang_label: 'Argot',
    no_formal: 'Aucune entrée Merriam-Webster.',
    no_slang: 'Aucune entrée Urban Dictionary.',
    error: 'Une erreur est survenue. Réessayez.',
    did_you_mean: 'Vouliez-vous dire…',
    definitions_in_english: 'Les définitions sont en anglais. L\u2019argot provient d\u2019Urban Dictionary et peut être explicite.',
    nsfw_notice: 'Les résultats d\u2019Urban Dictionary peuvent contenir du contenu explicite ou offensant.',
    nsfw_dismiss: 'D\u2019accord',
    play_audio: 'Écouter la prononciation',
    open_on_ud: 'Ouvrir sur Urban Dictionary',
    language: 'Langue',
    mw_rate_limited: 'Limite quotidienne de Merriam-Webster atteinte — les définitions formelles reviennent demain.',
  },
  pt: {
    placeholder: 'Procure uma palavra…',
    search_prompt: 'Digite uma palavra e pressione enter.',
    formal_label: 'Formal',
    slang_label: 'Gíria',
    no_formal: 'Sem entrada no Merriam-Webster.',
    no_slang: 'Sem entrada no Urban Dictionary.',
    error: 'Algo deu errado. Tente novamente.',
    did_you_mean: 'Você quis dizer…',
    definitions_in_english: 'As definições estão em inglês. A gíria vem do Urban Dictionary e pode ser explícita.',
    nsfw_notice: 'Os resultados do Urban Dictionary podem conter conteúdo explícito ou ofensivo.',
    nsfw_dismiss: 'Entendi',
    play_audio: 'Tocar pronúncia',
    open_on_ud: 'Abrir no Urban Dictionary',
    language: 'Idioma',
    mw_rate_limited: 'Limite diário do Merriam-Webster atingido — as definições formais voltam amanhã.',
  },
  zh: {
    placeholder: '查一个词…',
    search_prompt: '输入一个词然后按回车。',
    formal_label: '正式释义',
    slang_label: '俚语',
    no_formal: '韦氏词典暂无收录。',
    no_slang: 'Urban Dictionary 暂无收录。',
    error: '出错了，请重试。',
    did_you_mean: '你是想搜…',
    definitions_in_english: '释义为英文。俚语来自 Urban Dictionary，可能包含敏感内容。',
    nsfw_notice: 'Urban Dictionary 的结果可能含有露骨或冒犯性内容。',
    nsfw_dismiss: '知道了',
    play_audio: '播放发音',
    open_on_ud: '在 Urban Dictionary 中打开',
    language: '语言',
    mw_rate_limited: '今日韦氏词典调用次数已达上限 —— 正式释义将于明日恢复。',
  },
}

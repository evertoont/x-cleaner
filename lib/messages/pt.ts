import { countOf } from './count-of'
import type { Messages } from './en'

export const pt: Messages = {
  kinds: {
    tweet: 'Posts',
    reply: 'Respostas',
    retweet: 'Reposts',
    like: 'Curtidas',
  },
  nav: {
    activityHeading: 'Atividade',
    peopleHeading: 'Pessoas',
    selectedCount: (count: number) => countOf(count, 'selecionado', 'selecionados'),
  },
  people: {
    captureTargets: {
      following: 'Seguindo',
      followers: 'Seguidores',
    },
    lists: {
      nonFollowers: {
        title: 'Não te seguem de volta',
        emptyTitle: 'Ninguém listado ainda',
        emptyDescription:
          'Marque Seguindo em Capturar do X e clique em Capturar para ver quem não te segue de volta.',
      },
      followers: {
        title: 'Seguidores',
        emptyTitle: 'Nenhum seguidor listado ainda',
        emptyDescription:
          'Marque Seguidores em Capturar do X e clique em Capturar para listar quem te segue.',
      },
    },
    followerFilterLabel: 'Mostrar',
    followerFilters: {
      all: 'Todos',
      mutual: 'Mútuos',
      notFollowedBack: 'Você não segue de volta',
    },
    noFilterMatchesTitle: 'Ninguém aqui',
    noFilterMatchesDescription: 'Nenhum seguidor corresponde a este filtro.',
    sortLabel: 'Ordenar por',
    sorts: {
      recent: 'Mais recentes primeiro',
      mostFollowers: 'Mais seguidores',
      fewestFollowers: 'Menos seguidores',
    },
    followerCount: (count: number, formattedCount: string) =>
      count === 1 ? '1 seguidor' : `${formattedCount} seguidores`,
    followingCount: (formattedCount: string) => `${formattedCount} seguindo`,
    mutual: 'Vocês se seguem',
    notFollowedBack: 'Você não segue de volta',
    verified: 'Verificado',
    openProfile: 'Abrir perfil no X',
    moreAccounts: (count: number) => `e mais ${count}`,
  },
  accountActions: {
    unfollow: {
      button: (count: number) => `Deixar de seguir ${count}`,
      dialogTitle: (count: number) => `Deixar de seguir ${countOf(count, 'conta', 'contas')}?`,
      effect: 'Você pode voltar a seguir pelo X quando quiser.',
      done: (count: number) => `Você deixou de seguir ${countOf(count, 'conta', 'contas')}.`,
      nobody: 'Nenhum unfollow foi feito.',
      progress: (completed: number, total: number) => `Deixando de seguir ${completed} de ${total}`,
      milestone: (percentDone: number) => `Deixando de seguir: ${percentDone}% concluído`,
    },
    removeFollower: {
      button: (count: number) => `Remover ${count}`,
      dialogTitle: (count: number) => `Remover ${countOf(count, 'seguidor', 'seguidores')}?`,
      effect: 'A pessoa não é avisada, mas pode voltar a te seguir.',
      done: (count: number) => `${countOf(count, 'seguidor removido', 'seguidores removidos')}.`,
      nobody: 'Nenhum seguidor foi removido.',
      progress: (completed: number, total: number) => `Removendo seguidores ${completed} de ${total}`,
      milestone: (percentDone: number) => `Removendo seguidores: ${percentDone}% concluído`,
    },
  },
  accountRemoval: {
    duration: (duration: string) => `Leva cerca de ${duration}, em ritmo lento para proteger sua conta.`,
    dailyLimit: (limit: number) =>
      `O X Cleaner para depois de ${limit} por dia; o restante fica selecionado para depois.`,
    failed: (count: number) =>
      count === 1
        ? '1 conta falhou e continua na lista.'
        : `${count} contas falharam e continuam na lista.`,
    heldBack: (count: number, resumeTime: string) =>
      `Limite diário atingido: ${countOf(count, 'conta continua selecionada', 'contas continuam selecionadas')}. Continue depois de ${resumeTime}.`,
    limitReached: (resumeTime: string) =>
      `Você atingiu o limite de hoje para esta ação. Continue depois de ${resumeTime}.`,
  },
  sidebar: {
    footnote: 'Roda no seu navegador e só conversa com o x.com.',
  },
  capture: {
    heading: 'Capturar do X',
    legend: 'O que capturar',
    button: 'Capturar',
    hint: 'A aba do X rola sozinha e depois volta para cá.',
  },
  archive: {
    heading: 'Arquivo do X',
    button: 'Importar tweets.js',
    hint: 'Do arquivo de dados que o X envia (data/tweets.js). Traz o que o perfil e a pesquisa deixam de fora.',
    imported: (count: number) => `${countOf(count, 'item lido', 'itens lidos')} do arquivo.`,
  },
  list: {
    emptyTitle: 'Nada capturado ainda',
    emptyDescription: 'Escolha o que buscar em Capturar do X, na barra ao lado, e clique em Capturar.',
    emptyKindTitle: (kindLabel: string) => `Nada em ${kindLabel}`,
    emptyKindDescription: 'Marque esse tipo em Capturar do X para buscar de novo.',
    openOnX: 'Abrir no X',
    mediaOnly: 'Sem texto, só mídia',
    noDate: 'sem data',
    repostOf: (handle: string) => `Repost de @${handle}`,
    replyingTo: (handle: string) => `em resposta a @${handle}`,
  },
  toolbar: {
    selectAll: 'Selecionar todos',
    selectFailed: (count: number) => `Selecionar ${count} com falha`,
    clearSelection: 'Limpar seleção',
    stop: 'Parar',
    cancel: 'Cancelar',
    technicalDetails: 'Detalhes técnicos',
    keepTabsOpen: 'Deixe este painel e a aba do X abertos até terminar: os itens são removidos por eles.',
    keepXTabOpen:
      'Pode fechar este painel: a remoção continua em segundo plano. Deixe a aba do X aberta até terminar.',
  },
  removal: {
    button: {
      delete: (count: number) => `Apagar ${count}`,
      undoRepost: (count: number) => `Desfazer ${countOf(count, 'repost', 'reposts')}`,
      unlike: (count: number) => `Descurtir ${count}`,
      mixed: (count: number) => `Remover ${count}`,
    },
    confirmActions: {
      tweet: (count: number) => `apagar ${countOf(count, 'post', 'posts')}`,
      reply: (count: number) => `apagar ${countOf(count, 'resposta', 'respostas')}`,
      retweet: (count: number) => `desfazer ${countOf(count, 'repost', 'reposts')}`,
      like: (count: number) => `remover ${countOf(count, 'curtida', 'curtidas')}`,
    },
    done: {
      tweet: (count: number) => countOf(count, 'post apagado', 'posts apagados'),
      reply: (count: number) => countOf(count, 'resposta apagada', 'respostas apagadas'),
      retweet: (count: number) => countOf(count, 'repost desfeito', 'reposts desfeitos'),
      like: (count: number) => countOf(count, 'curtida removida', 'curtidas removidas'),
    },
    stopped: 'Interrompido.',
    nothingRemoved: 'Nada foi removido.',
    failed: (count: number) =>
      count === 1
        ? '1 item falhou e continua na lista.'
        : `${count} itens falharam e continuam na lista.`,
  },
  confirmDialog: {
    title: (count: number) => `Remover ${countOf(count, 'item', 'itens')}?`,
    duration: (duration: string) => `Leva cerca de ${duration}. Deixe a aba do X aberta até terminar.`,
    irreversible: 'Não dá para reverter.',
    backgroundRun: 'Continuar mesmo se eu fechar este painel',
  },
  activity: {
    openingX: 'Abrindo o X…',
    capturing: (kindLabel: string, step: number, totalSteps: number) =>
      `Capturando ${kindLabel} (${step} de ${totalSteps})… a aba do X rola sozinha.`,
    capturingSearch: (kindLabel: string, step: number, totalSteps: number) =>
      `Capturando ${kindLabel} pela pesquisa do X (${step} de ${totalSteps})… a aba do X rola sozinha.`,
    removing: (completed: number, total: number) => `Removendo ${completed} de ${total}`,
    timeLeft: (duration: string) => `cerca de ${duration} para terminar`,
    rateLimited: (resumeTime: string) => `limite do X atingido, retomando às ${resumeTime}`,
    removalMilestone: (percentDone: number) => `Removendo: ${percentDone}% concluído`,
  },
  captureOutcome: {
    fetched: (count: number) => `${countOf(count, 'item capturado', 'itens capturados')}.`,
    stopped: 'Captura interrompida.',
    nothingFound: (kindList: string) => `Nada encontrado em ${kindList}.`,
    diagnostics: (responseCount: number, operations: string) =>
      `Respostas de timeline lidas: ${responseCount}. Operações que o x.com enviou: ${operations}.`,
    noOperations: 'nenhuma',
  },
  overlay: {
    capturing: (kindLabel: string) => `X Cleaner · capturando ${kindLabel}…`,
    stopping: 'X Cleaner · parando…',
    stop: 'Parar captura',
    removing: (progress: string) => `X Cleaner · ${progress}`,
    stopRemoval: 'Parar',
  },
  progress: {
    capturing: 'Capturando',
    removing: 'Removendo',
  },
  errors: {
    tabUnavailable: 'A aba do x.com foi fechada ou não respondeu. Tente de novo.',
    notLoggedIn: 'Não encontrei sua conta no x.com. Faça login e tente de novo.',
    sessionExpired: 'Sua sessão no x.com expirou. Faça login de novo e continue de onde parou.',
    accountLocked:
      'O X bloqueou sua conta temporariamente. Abra o x.com para desbloquear e tente de novo.',
    network: 'Não foi possível falar com o X. Verifique sua conexão.',
    removalRejected: 'O X recusou a remoção.',
    removalHttpError: (httpStatus: number) => `O X respondeu com erro ${httpStatus}.`,
    archiveFileInvalid: (fileName: string) =>
      `${fileName} não parece ser o tweets.js do arquivo do X.`,
    generic: 'Algo deu errado. Tente de novo.',
  },
}

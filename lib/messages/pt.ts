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
    label: 'Tipos de item',
    selectedCount: (count: number) => countOf(count, 'selecionado', 'selecionados'),
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
    confirm: (actionSummary: string) => `${actionSummary}? Não dá para reverter.`,
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
    duration: (duration: string) =>
      `Leva cerca de ${duration}. Deixe este painel e a aba do X abertos até terminar.`,
    irreversible: 'Não dá para reverter.',
  },
  activity: {
    openingX: 'Abrindo o X…',
    capturing: (kindLabel: string, step: number, totalSteps: number) =>
      `Capturando ${kindLabel} (${step} de ${totalSteps})… a aba do X rola sozinha.`,
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
  },
  progress: {
    capturing: 'Capturando',
    removing: 'Removendo',
  },
  errors: {
    tabUnavailable: 'A aba do x.com foi fechada ou não respondeu. Tente de novo.',
    notLoggedIn: 'Não encontrei sua conta no x.com. Faça login e tente de novo.',
    sessionExpired: 'Sua sessão no x.com expirou. Faça login de novo e continue de onde parou.',
    network: 'Não foi possível falar com o X. Verifique sua conexão.',
    removalRejected: 'O X recusou a remoção.',
    removalHttpError: (httpStatus: number) => `O X respondeu com erro ${httpStatus}.`,
    generic: 'Algo deu errado. Tente de novo.',
  },
}

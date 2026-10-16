import { vi } from 'vitest'

// O idioma da interface segue o navegador; nos testes ele fica fixo para não depender da máquina.
vi.stubGlobal('navigator', { language: 'en-US' })

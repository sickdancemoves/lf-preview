// Per-page metadata. Edit titles/descriptions here — build.js stitches them
// into each page's <head>. PT is the source language (Brazilian product).
//
// Canonical defaults to https://la-finteca.com; override with the BASE_URL
// env var when building for staging (e.g. BASE_URL=https://preview.la-finteca.com node build.js).

const BASE_URL = (process.env.BASE_URL || 'https://la-finteca.com').replace(/\/$/, '');

module.exports = {
  baseUrl: BASE_URL,
  defaultLang: 'pt',
  pages: [
    {
      name: 'home',
      route: '/',
      title: 'LaFinteca — Conta PJ digital para empresas no Brasil',
      description: 'Conta PJ digital com TED, boletos e PIX. Atendimento humano e tarifas transparentes para empresas no Brasil.',
    },
    {
      name: 'contapj',
      route: '/contapj/',
      title: 'Conta PJ — LaFinteca',
      description: 'Abra uma Conta PJ digital com TED, boletos, PIX e atendimento dedicado. Sem tarifas escondidas.',
    },
    {
      name: 'about',
      route: '/about/',
      title: 'Sobre nós — LaFinteca',
      description: 'Conheça a LaFinteca: instituição de pagamento autorizada pelo Banco Central, focada em empresas no Brasil.',
    },
    {
      name: 'events',
      route: '/events/',
      title: 'Eventos — LaFinteca',
      description: 'Encontre a equipe da LaFinteca em eventos e fóruns de pagamentos pelo Brasil e América Latina.',
    },
    {
      name: 'blog',
      route: '/blog/',
      title: 'Blog — LaFinteca',
      description: 'Insights, novidades de produto e conteúdo sobre pagamentos B2B no Brasil.',
    },
    {
      name: 'careers',
      route: '/careers/',
      title: 'Carreiras — LaFinteca',
      description: 'Junte-se à LaFinteca. Vagas abertas em produto, engenharia, operações e atendimento.',
    },
    {
      name: 'faqs',
      route: '/faqs/',
      title: 'Perguntas frequentes — LaFinteca',
      description: 'Respostas sobre Conta PJ, tarifas, segurança e operações da LaFinteca.',
    },
    {
      name: 'contact',
      route: '/contact/',
      title: 'Contato — LaFinteca',
      description: 'Fale com a equipe da LaFinteca. Atendimento humano para empresas no Brasil.',
    },
    {
      name: 'politicas',
      route: '/politicas/',
      title: 'Centro de Políticas — LaFinteca',
      description: 'Documentos de governança, segurança e conformidade da LaFinteca — instituição de pagamento autorizada pelo Banco Central.',
    },
    {
      name: 'politicas/codigo-de-conduta',
      route: '/politicas/codigo-de-conduta/',
      title: 'Código de Conduta — LaFinteca',
      description: 'Princípios éticos e padrões de comportamento para todos os colaboradores da LaFinteca.',
    },
    {
      name: 'politicas/compliance',
      route: '/politicas/compliance/',
      title: 'Política de Compliance — LaFinteca',
      description: 'Diretrizes para garantir a conformidade da LaFinteca com as obrigações legais e regulatórias.',
    },
    {
      name: 'politicas/prevencao-fraude-corrupcao',
      route: '/politicas/prevencao-fraude-corrupcao/',
      title: 'Política de Prevenção à Fraude e à Corrupção — LaFinteca',
      description: 'Medidas para prevenir, detectar e combater atos de fraude e corrupção na LaFinteca.',
    },
    {
      name: 'politicas/privacidade-de-dados',
      route: '/politicas/privacidade-de-dados/',
      title: 'Política de Privacidade de Dados — LaFinteca',
      description: 'Como a LaFinteca coleta, utiliza e protege os dados pessoais dos seus usuários.',
    },
    {
      name: 'politicas/seguranca-da-informacao',
      route: '/politicas/seguranca-da-informacao/',
      title: 'Política de Segurança da Informação — LaFinteca',
      description: 'Diretrizes de proteção dos sistemas, redes e informações corporativas da LaFinteca.',
    },
    {
      name: 'politicas/gestao-de-riscos',
      route: '/politicas/gestao-de-riscos/',
      title: 'Política de Gestão de Riscos — LaFinteca',
      description: 'Estrutura da LaFinteca para identificação, avaliação e mitigação dos riscos institucionais.',
    },
    {
      name: 'politicas/riscos-de-terceiros',
      route: '/politicas/riscos-de-terceiros/',
      title: 'Política de Gestão de Riscos de Terceiros — LaFinteca',
      description: 'Controles para avaliação e monitoramento de riscos associados a fornecedores e parceiros.',
    },
    {
      name: 'politicas/pld-cft',
      route: '/politicas/pld-cft/',
      title: 'Manual Operacional de PLD/CFT — LaFinteca',
      description: 'Procedimentos de prevenção à lavagem de dinheiro e ao financiamento do terrorismo na LaFinteca.',
    },
  ],
};

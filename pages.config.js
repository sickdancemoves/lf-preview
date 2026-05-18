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
  ],
};

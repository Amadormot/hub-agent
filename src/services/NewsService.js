// This service simulates an external API (like Supabase/Firebase)
// In production, these methods would filter by date, category, etc.

const MOCK_NEWS = [
    {
        id: 'news-1',
        title: 'Honda lança nova CB 500 Hornet 2026',
        summary: 'A nova naked da Honda chega com visual agressivo e motor otimizado para o mercado brasileiro.',
        source: 'MotoMundo',
        url: '#',
        date: 'Há 2 horas',
        image: 'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?q=80&w=1000&auto=format&fit=crop',
        type: 'news'
    },
    {
        id: 'news-2',
        title: 'Dicas de pilotagem na chuva',
        summary: 'Especialistas dão dicas cruciais para manter a segurança em dias chuvosos.',
        source: 'SegurançaBR',
        url: '#',
        date: 'Há 5 horas',
        image: 'https://images.unsplash.com/photo-1515777315835-281b94c9589f?q=80&w=1000&auto=format&fit=crop',
        type: 'news'
    },
    {
        id: 'news-3',
        title: 'Triumph anuncia novas cores para a linha Tiger',
        summary: 'Aventureiras ganham opções de cores vibrantes para a nova coleção.',
        source: 'DuasRodas',
        url: '#',
        date: 'Ontem',
        image: 'https://images.unsplash.com/photo-1625043484555-47841a750399?q=80&w=1000&auto=format&fit=crop',
        type: 'news'
    }
];

const MOCK_AFFILIATES = [
    {
        id: 'aff-1',
        name: 'Capacete LS2 Stream II - Promoção',
        price: 'R$ 799,00',
        oldPrice: 'R$ 950,00',
        category: 'Equipamentos',
        image: 'https://images.unsplash.com/photo-1558981033-0f0309284128?q=80&w=1000&auto=format&fit=crop',
        link: '#',
        affiliateTag: 'PARCEIRO',
        type: 'ad',
        discount: '15% OFF'
    },
    {
        id: 'aff-2',
        name: 'Luva X11 Blackout - Impermeável',
        price: 'R$ 149,90',
        category: 'Acessórios',
        image: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?q=80&w=1000&auto=format&fit=crop',
        link: '#',
        affiliateTag: 'OFERTA',
        type: 'ad'
    }
];

export const NewsService = {
    getNews: async () => {
        // Simulate network delay
        return new Promise(resolve => {
            setTimeout(() => resolve(MOCK_NEWS), 800);
        });
    },

    getAffiliates: async () => {
        return new Promise(resolve => {
            setTimeout(() => resolve(MOCK_AFFILIATES), 600);
        });
    }
};

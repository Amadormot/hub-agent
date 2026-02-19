
export const routesData = [
    {
        id: 1,
        name: 'Serra do Rio do Rastro',
        difficulty: 'Expert',
        distance: '24km',
        image: 'https://images.unsplash.com/photo-1621847466085-3004b901a7S8?q=80&w=600&auto=format&fit=crop',
        xp: 500,
        likes: 1250,
        latitude: -28.3949,
        longitude: -49.6105,
        origin: 'Lauro Müller - SC',
        destination: 'Bom Jardim da Serra - SC',
        createdBy: {
            id: 'u1',
            name: 'Amador Mota',
            level: 42,
            avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop',
            bio: 'Explorador de serras e apaixonado por curvas. Sempre em busca da próxima aventura.',
            patches: ['serra-expert', 'night-rider', 'long-distance'],
            completedRoutes: [
                { name: 'Rota do Sol', distance: '120km', date: '12/02/2026' },
                { name: 'Estrada Real', distance: '45km', date: '10/01/2026' }
            ],
            suggestedRoutes: [
                { name: 'Serra do Rio do Rastro', distance: '24km', area: 'SC' }
            ],
            followers: 1250,
            following: 890,
            followersList: ['u2', 'u3', 'u4'],
            followingList: ['u2', 'u4'],
            clubBadge: 'https://cdn-icons-png.flaticon.com/512/3233/3233514.png', // Harley Style Badge
            avatarFraming: { zoom: 1, x: 0, y: 0 },
            badgeFraming: { zoom: 1, x: 0, y: 0 }
        }
    },
    {
        id: 2,
        name: 'Rota do Sol',
        difficulty: 'Médio',
        distance: '120km',
        image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=600&auto=format&fit=crop',
        xp: 300,
        likes: 850,
        latitude: -29.3587,
        longitude: -50.7766,
        origin: 'Gramado - RS',
        destination: 'Torres - RS',
        createdBy: {
            id: 'u2',
            name: 'Fernanda Moto',
            level: 28,
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
            bio: 'Viajando o Brasil sobre duas rodas. Rota do Sol é minha casa.',
            patches: ['beach-rider', 'sunset-chaser'],
            completedRoutes: [
                { name: 'Serra do Rio do Rastro', distance: '24km', date: '05/03/2025' }
            ],
            suggestedRoutes: [
                { name: 'Rota do Sol', distance: '120km', area: 'RS' }
            ],
            followers: 850,
            following: 120,
            followersList: ['u1', 'u3'],
            followingList: ['u1', 'u4'],
            clubBadge: 'https://cdn-icons-png.flaticon.com/512/3233/3233529.png', // Racing Style Badge
            avatarFraming: { zoom: 1, x: 0, y: 0 },
            badgeFraming: { zoom: 1, x: 0, y: 0 }
        }
    },
    {
        id: 3,
        name: 'Estrada Real',
        difficulty: 'Lazer',
        distance: '45km',
        image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=600&auto=format&fit=crop',
        xp: 150,
        likes: 2100,
        latitude: -20.3856,
        longitude: -43.5036,
        origin: 'Belo Horizonte - MG',
        destination: 'Ouro Preto - MG',
        createdBy: {
            id: 'u3',
            name: 'Clube Vintage',
            level: 55,
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
            bio: 'Preservando a história do motociclismo nacional. Organização oficial.',
            patches: ['vintage-soul', 'history-keeper', 'group-leader'],
            completedRoutes: [],
            suggestedRoutes: [
                { name: 'Estrada Real', distance: '45km', area: 'MG' },
                { name: 'Caminho dos Diamantes', distance: '180km', area: 'MG' }
            ],
            followers: 3400,
            following: 55,
            followersList: ['u1', 'u2', 'u4'],
            followingList: ['u1', 'u2'],
            clubBadge: 'https://cdn-icons-png.flaticon.com/512/3233/3233481.png', // Vintage Style Badge
            avatarFraming: { zoom: 1, x: 0, y: 0 },
            badgeFraming: { zoom: 1, x: 0, y: 0 }
        }
    },
];

export const eventsData = [
    {
        id: 1,
        title: 'Moto Laguna 2026',
        date: '12 MAR',
        startDate: '2026-03-12',
        endDate: '2026-03-15',
        location: 'Laguna, SC',
        premium: true,
        description: 'O maior encontro de motociclistas do sul do mundo! Shows, exposições e muito rock and roll na beira da praia.',
        image: 'https://images.unsplash.com/photo-1621847466085-3004b901a7S8?q=80&w=400&auto=format&fit=crop',
        likes: 3400,
        latitude: -28.4812,
        longitude: -48.7840,
        createdBy: {
            id: 'u3',
            name: 'Clube Vintage',
            level: 55,
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
            patches: ['vintage-soul', 'history-keeper'],
            clubBadge: 'https://cdn-icons-png.flaticon.com/512/3233/3233481.png'
        }
    },
    {
        id: 2,
        title: 'Encontro Nacional',
        date: '05 ABR',
        startDate: '2026-04-05',
        endDate: '2026-04-05',
        location: 'Sorocaba, SP',
        premium: false,
        description: 'Reunião anual dos motoclubes brasileiros. Agora em Sorocaba para testes.',
        image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=400&auto=format&fit=crop',
        likes: 1200,
        latitude: -23.5015,
        longitude: -47.4521,
        createdBy: {
            id: 'u2',
            name: 'Fernanda Moto',
            level: 28,
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
            patches: ['beach-rider'],
            clubBadge: 'https://cdn-icons-png.flaticon.com/512/3233/3233529.png'
        }
    },
];

export const productsData = [
    {
        id: 1,
        name: 'Capacete LS2 Stream',
        category: 'Equipamentos',
        price: 'R$ 899,00',
        image: 'https://images.unsplash.com/photo-1557803175-298328003610?q=80&w=400&auto=format&fit=crop',
        link: 'https://www.google.com/search?q=Capacete+LS2+Stream',
        description: 'Capacete integral com ótima ventilação e viseira solar interna.',
        specs: ['Peso: 1550g', 'Viseira Solar', 'Forro Removível']
    },
    {
        id: 2,
        name: 'Jaqueta Couro Moto',
        category: 'Equipamentos',
        price: 'R$ 1.250,00',
        image: 'https://images.unsplash.com/photo-1560243563-062bfc001d68?q=80&w=400&auto=format&fit=crop',
        link: 'https://www.google.com/search?q=Jaqueta+Couro+Moto',
        description: 'Jaqueta de couro legítimo com proteções embutidas nos ombros e cotovelos.',
        specs: ['Couro Bovino', 'Proteção CE', 'Resistente à abrasão']
    },
    {
        id: 3,
        name: 'Luva X11 Black',
        category: 'Equipamentos',
        price: 'R$ 180,00',
        image: 'https://images.unsplash.com/photo-1625906841797-768a35560b37?q=80&w=400&auto=format&fit=crop',
        link: 'https://www.google.com/search?q=Luva+X11+Black',
        description: 'Luvas leves e confortáveis para o dia a dia urbano.',
        specs: ['Tecido Arejado', 'Touchscreen', 'Refletivos']
    },
    {
        id: 4,
        name: 'Kit Relação Vaz',
        category: 'Peças',
        price: 'R$ 250,00',
        image: 'https://images.unsplash.com/photo-1616423668352-7d121bc81d6d?q=80&w=400&auto=format&fit=crop',
        link: 'https://www.google.com/search?q=Kit+Relação+Vaz',
        description: 'Kit de transmissão completo de alta durabilidade (Corrente, Coroa e Pinhão).',
        specs: ['Aço 1045', 'Com Retentor', 'Alta Durabilidade']
    },
    {
        id: 5,
        name: 'Óleo Motul 5100',
        category: 'Manutenção',
        price: 'R$ 65,00',
        image: 'https://images.unsplash.com/photo-1635773173546-5ba257018803?q=80&w=400&auto=format&fit=crop',
        link: 'https://www.google.com/search?q=Óleo+Motul+5100',
        description: 'Óleo semissintético para motores 4 tempos com tecnologia Ester.',
        specs: ['Viscosidade 10W40', 'API SL', 'JASO MA2']
    },
    {
        id: 6,
        name: 'Suporte Celular',
        category: 'Acessórios',
        price: 'R$ 45,00',
        image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=400&auto=format&fit=crop',
        link: 'https://www.google.com/search?q=Suporte+Celular+Moto',
        description: 'Suporte universal com carregador USB integrado e fixação firme.',
        specs: ['Carregador USB', 'A prova d\'água', 'Rotação 360°']
    },
    {
        id: 7,
        name: 'Baú 45 Litros',
        category: 'Acessórios',
        price: 'R$ 320,00',
        image: 'https://images.unsplash.com/photo-1591632832822-7f91722881cf?q=80&w=400&auto=format&fit=crop',
        link: 'https://www.google.com/search?q=Baú+45+Litros+Moto',
        description: 'Baú espaçoso para dois capacetes, com sistema de engate rápido.',
        specs: ['Capacidade 45L', 'Lente Vermelha', 'Chave Reserva']
    },
];

export const mockUsers = [
    {
        id: 'u1',
        name: 'Amador Mota',
        level: 42,
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop',
        bio: 'Explorador de serras e apaixonado por curvas. Sempre em busca da próxima aventura.',
        followers: 1250,
        following: 890,
        followersList: ['u2', 'u3', 'u4'],
        followingList: ['u2', 'u4'],
        patches: ['serra-expert', 'night-rider'],
        clubBadge: 'https://cdn-icons-png.flaticon.com/512/3233/3233514.png',
        motorcycle: { brand: 'Harley-Davidson', model: 'Fat Boy', year: '2022' }
    },
    {
        id: 'u2',
        name: 'Fernanda Moto',
        level: 28,
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
        bio: 'Viajando o Brasil sobre duas rodas. Rota do Sol é minha casa.',
        followers: 850,
        following: 120,
        followersList: ['u1', 'u3'],
        followingList: ['u1', 'u4'],
        patches: ['beach-rider'],
        clubBadge: 'https://cdn-icons-png.flaticon.com/512/3233/3233529.png',
        motorcycle: { brand: 'Yamaha', model: 'MT-09', year: '2023' }
    },
    {
        id: 'u3',
        name: 'Clube Vintage',
        level: 55,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
        bio: 'Preservando a história do motociclismo nacional. Organização oficial.',
        followers: 3400,
        following: 55,
        followersList: ['u1', 'u2', 'u4'],
        followingList: ['u1', 'u2'],
        patches: ['vintage-soul', 'history-keeper'],
        clubBadge: 'https://cdn-icons-png.flaticon.com/512/3233/3233481.png',
        motorcycle: { brand: 'Triumph', model: 'Bonneville T120', year: '2021' }
    },
    {
        id: 'u4',
        name: 'Carlos Road',
        level: 15,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
        bio: 'Cruising through life one kilometer at a time.',
        patches: ['beginner-rider'],
        clubBadge: 'https://cdn-icons-png.flaticon.com/512/3233/3233514.png',
        motorcycle: { brand: 'Honda', model: 'CB 500X', year: '2023' }
    }
];


export const LEVEL_PATCHES = [
    { level: 1, name: "Iniciante do Asfalto", description: "O começo da jornada.", icon: "Baby" },
    { level: 2, name: "Primeira Marcha", description: "Pegando o jeito da embreagem.", icon: "Bike" },
    { level: 3, name: "Explorador Urbano", description: "Dominando as ruas da cidade.", icon: "Map" },
    { level: 4, name: "Rei da Curva", description: "Começando a inclinar nas serras.", icon: "TrendingUp" },
    { level: 5, name: "Viajante de Fim de Semana", description: "Primeiros bate-e-volta longe de casa.", icon: "Sunrise" },
    { level: 6, name: "Iron Butt", description: "Resistência em longas distâncias.", icon: "BatteryCharging" },
    { level: 7, name: "Mestre da Chuva", description: "Enfrenta qualquer tempestade.", icon: "CloudRain" },
    { level: 8, name: "Capitão de Estrada", description: "Líder do comboio.", icon: "Users" },
    { level: 9, name: "Nômade", description: "A estrada é sua casa.", icon: "Tent" },
    { level: 10, name: "Lenda das Rodovias", description: "Respeitado por onde passa.", icon: "Crown" },
];

export const getPatchByLevel = (level) => {
    return LEVEL_PATCHES.find(p => p.level === level);
};

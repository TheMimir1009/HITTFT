// 적 웨이브 데이터 정의
const WAVES_DATA = [
    // 라운드 1: 도적 습격
    {
        round: 1,
        name: '도적 습격',
        difficulty: 1,
        enemies: [
            { type: 'bandit', count: 3 }
        ],
        baseDamage: 3,
        damagePerEnemy: 1
    },
    // 라운드 2: 늑대 무리
    {
        round: 2,
        name: '늑대 무리',
        difficulty: 1,
        enemies: [
            { type: 'wolf', count: 4 }
        ],
        baseDamage: 3,
        damagePerEnemy: 1
    },
    // 라운드 3: 산적단
    {
        round: 3,
        name: '산적단',
        difficulty: 2,
        enemies: [
            { type: 'bandit', count: 3 },
            { type: 'bandit_leader', count: 1 }
        ],
        baseDamage: 3,
        damagePerEnemy: 1
    },
    // 라운드 4: 고블린 부대
    {
        round: 4,
        name: '고블린 부대',
        difficulty: 2,
        enemies: [
            { type: 'goblin', count: 5 }
        ],
        baseDamage: 5,
        damagePerEnemy: 2
    },
    // 라운드 5: 오크 정찰대
    {
        round: 5,
        name: '오크 정찰대',
        difficulty: 3,
        enemies: [
            { type: 'orc_warrior', count: 3 },
            { type: 'orc_archer', count: 2 }
        ],
        baseDamage: 5,
        damagePerEnemy: 2
    },
    // 라운드 6: 언데드 출현
    {
        round: 6,
        name: '언데드 출현',
        difficulty: 3,
        enemies: [
            { type: 'skeleton', count: 4 },
            { type: 'necromancer', count: 1 }
        ],
        baseDamage: 5,
        damagePerEnemy: 2
    },
    // 라운드 7: 암흑 기사단
    {
        round: 7,
        name: '암흑 기사단',
        difficulty: 4,
        enemies: [
            { type: 'dark_knight', count: 3 },
            { type: 'dark_mage', count: 2 }
        ],
        baseDamage: 8,
        damagePerEnemy: 3
    },
    // 라운드 8: 트롤 침공
    {
        round: 8,
        name: '트롤 침공',
        difficulty: 4,
        enemies: [
            { type: 'troll', count: 2 },
            { type: 'troll_shaman', count: 1 }
        ],
        baseDamage: 8,
        damagePerEnemy: 3
    },
    // 라운드 9: 마왕의 선봉대
    {
        round: 9,
        name: '마왕의 선봉대',
        difficulty: 5,
        enemies: [
            { type: 'demon_warrior', count: 4 },
            { type: 'demon_archer', count: 2 }
        ],
        baseDamage: 8,
        damagePerEnemy: 3
    },
    // 라운드 10: 드래곤 로드 (보스)
    {
        round: 10,
        name: '드래곤 로드',
        difficulty: 5,
        isBoss: true,
        enemies: [
            { type: 'dragon_lord', count: 1 },
            { type: 'dragon', count: 2 }
        ],
        baseDamage: 15,
        damagePerEnemy: 5
    }
];

// 적 유닛 데이터
const ENEMY_UNITS_DATA = {
    // 라운드 1-2
    bandit: {
        id: 'bandit',
        name: '도적',
        stats: {
            hp: 300,
            attack: 30,
            attackSpeed: 0.8,
            range: 1,
            defense: 10
        },
        icon: '🗡️'
    },
    wolf: {
        id: 'wolf',
        name: '늑대',
        stats: {
            hp: 250,
            attack: 35,
            attackSpeed: 1.0,
            range: 1,
            defense: 5
        },
        icon: '🐺'
    },

    // 라운드 3-4
    bandit_leader: {
        id: 'bandit_leader',
        name: '산적 두목',
        stats: {
            hp: 500,
            attack: 45,
            attackSpeed: 0.7,
            range: 1,
            defense: 20
        },
        icon: '💀'
    },
    goblin: {
        id: 'goblin',
        name: '고블린',
        stats: {
            hp: 280,
            attack: 32,
            attackSpeed: 0.9,
            range: 1,
            defense: 8
        },
        icon: '👺'
    },

    // 라운드 5-6
    orc_warrior: {
        id: 'orc_warrior',
        name: '오크 전사',
        stats: {
            hp: 600,
            attack: 50,
            attackSpeed: 0.6,
            range: 1,
            defense: 25
        },
        icon: '👹'
    },
    orc_archer: {
        id: 'orc_archer',
        name: '오크 궁수',
        stats: {
            hp: 350,
            attack: 45,
            attackSpeed: 0.8,
            range: 3,
            defense: 10
        },
        icon: '🏹'
    },
    skeleton: {
        id: 'skeleton',
        name: '스켈레톤',
        stats: {
            hp: 320,
            attack: 38,
            attackSpeed: 0.85,
            range: 1,
            defense: 5
        },
        icon: '💀'
    },
    necromancer: {
        id: 'necromancer',
        name: '네크로맨서',
        stats: {
            hp: 400,
            attack: 55,
            attackSpeed: 0.5,
            range: 3,
            defense: 15
        },
        icon: '🧙'
    },

    // 라운드 7-8
    dark_knight: {
        id: 'dark_knight',
        name: '암흑 기사',
        stats: {
            hp: 750,
            attack: 60,
            attackSpeed: 0.55,
            range: 1,
            defense: 40
        },
        icon: '🖤'
    },
    dark_mage: {
        id: 'dark_mage',
        name: '암흑 마법사',
        stats: {
            hp: 450,
            attack: 70,
            attackSpeed: 0.5,
            range: 3,
            defense: 15
        },
        icon: '🔮'
    },
    troll: {
        id: 'troll',
        name: '트롤',
        stats: {
            hp: 1000,
            attack: 65,
            attackSpeed: 0.45,
            range: 1,
            defense: 35
        },
        icon: '🧌'
    },
    troll_shaman: {
        id: 'troll_shaman',
        name: '트롤 주술사',
        stats: {
            hp: 550,
            attack: 50,
            attackSpeed: 0.55,
            range: 3,
            defense: 20
        },
        icon: '🪬'
    },

    // 라운드 9-10
    demon_warrior: {
        id: 'demon_warrior',
        name: '악마 전사',
        stats: {
            hp: 700,
            attack: 70,
            attackSpeed: 0.65,
            range: 1,
            defense: 30
        },
        icon: '👿'
    },
    demon_archer: {
        id: 'demon_archer',
        name: '악마 궁수',
        stats: {
            hp: 450,
            attack: 65,
            attackSpeed: 0.85,
            range: 4,
            defense: 15
        },
        icon: '😈'
    },
    dragon: {
        id: 'dragon',
        name: '드래곤',
        stats: {
            hp: 900,
            attack: 80,
            attackSpeed: 0.5,
            range: 2,
            defense: 40
        },
        icon: '🐲'
    },
    dragon_lord: {
        id: 'dragon_lord',
        name: '드래곤 로드',
        stats: {
            hp: 2000,
            attack: 100,
            attackSpeed: 0.4,
            range: 2,
            defense: 60
        },
        icon: '🐉',
        isBoss: true
    }
};

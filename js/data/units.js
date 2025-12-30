// 유닛 데이터 정의
const UNITS_DATA = {
    // === 1코스트 유닛 (6종) ===
    'kiki_guardian': {
        id: 'kiki_guardian',
        name: '키키 수호자',
        cost: 1,
        weapon: 'greatsword',
        race: 'kiki',
        stats: {
            hp: 550,
            attack: 40,
            attackSpeed: 0.65,
            range: 1,
            defense: 30,
            mana: 0,
            maxMana: 100,
            moveSpeed: 0.8
        },
        skill: {
            name: '작은 수호',
            description: '방어력이 50% 증가합니다 (5초간)',
            effect: 'defense_buff',
            value: 50,
            duration: 5
        },
        icon: '🛡️'
    },
    'kiki_sorcerer': {
        id: 'kiki_sorcerer',
        name: '키키 요술사',
        cost: 1,
        weapon: 'staff',
        race: 'kiki',
        stats: {
            hp: 380,
            attack: 50,
            attackSpeed: 0.6,
            range: 3,
            defense: 10,
            mana: 0,
            maxMana: 80,
            moveSpeed: 1.0
        },
        skill: {
            name: '반짝이는 별',
            description: '적에게 마법 피해 150을 입힙니다',
            effect: 'magic_damage',
            value: 150
        },
        icon: '✨'
    },
    'velua_dancer': {
        id: 'velua_dancer',
        name: '벨루아 무희',
        cost: 1,
        weapon: 'twin_blades',
        race: 'velua',
        stats: {
            hp: 420,
            attack: 55,
            attackSpeed: 1.0,
            range: 1,
            defense: 15,
            mana: 0,
            maxMana: 70,
            moveSpeed: 1.4
        },
        skill: {
            name: '현혹의 춤',
            description: '회피율이 30% 증가합니다 (4초간)',
            effect: 'evasion_buff',
            value: 30,
            duration: 4
        },
        icon: '💃'
    },
    'farmer': {
        id: 'farmer',
        name: '농부',
        cost: 1,
        weapon: 'gauntlet',
        race: 'male',
        stats: {
            hp: 500,
            attack: 45,
            attackSpeed: 0.7,
            range: 1,
            defense: 25,
            mana: 0,
            maxMana: 90,
            moveSpeed: 1.0
        },
        skill: {
            name: '대지의 힘',
            description: '체력을 150 회복합니다',
            effect: 'heal',
            value: 150
        },
        icon: '👨‍🌾'
    },
    'hunter': {
        id: 'hunter',
        name: '사냥꾼',
        cost: 1,
        weapon: 'bow',
        race: 'female',
        stats: {
            hp: 400,
            attack: 50,
            attackSpeed: 0.85,
            range: 4,
            defense: 10,
            mana: 0,
            maxMana: 70,
            moveSpeed: 1.0
        },
        skill: {
            name: '속사',
            description: '3회 연속 공격합니다',
            effect: 'multi_attack',
            value: 3
        },
        icon: '🏹'
    },
    'elf_apprentice': {
        id: 'elf_apprentice',
        name: '엘프 견습생',
        cost: 1,
        weapon: 'staff',
        race: 'elf',
        stats: {
            hp: 400,
            attack: 52,
            attackSpeed: 0.6,
            range: 3,
            defense: 12,
            mana: 0,
            maxMana: 75,
            moveSpeed: 1.0
        },
        skill: {
            name: '자연의 화살',
            description: '적에게 마법 피해 140을 입힙니다',
            effect: 'magic_damage',
            value: 140
        },
        icon: '🌿'
    },

    // === 2코스트 유닛 (6종) ===
    'velua_witch': {
        id: 'velua_witch',
        name: '벨루아 마녀',
        cost: 2,
        weapon: 'staff',
        race: 'velua',
        stats: {
            hp: 450,
            attack: 60,
            attackSpeed: 0.55,
            range: 3,
            defense: 15,
            mana: 0,
            maxMana: 90,
            moveSpeed: 1.0
        },
        skill: {
            name: '매혹의 저주',
            description: '적 전체의 공격력을 20% 감소시킵니다 (5초간)',
            effect: 'enemy_attack_debuff',
            value: 20,
            duration: 5
        },
        icon: '🔮'
    },
    'swordswoman': {
        id: 'swordswoman',
        name: '여검사',
        cost: 2,
        weapon: 'greatsword',
        race: 'female',
        stats: {
            hp: 650,
            attack: 55,
            attackSpeed: 0.6,
            range: 1,
            defense: 35,
            mana: 0,
            maxMana: 100,
            moveSpeed: 0.8
        },
        skill: {
            name: '칼날 폭풍',
            description: '주변 적에게 공격력의 150% 피해를 입힙니다',
            effect: 'aoe_damage',
            value: 150
        },
        icon: '⚔️'
    },
    'knight': {
        id: 'knight',
        name: '기사',
        cost: 2,
        weapon: 'greatsword',
        race: 'male',
        stats: {
            hp: 700,
            attack: 50,
            attackSpeed: 0.55,
            range: 1,
            defense: 45,
            mana: 0,
            maxMana: 100,
            moveSpeed: 0.8
        },
        skill: {
            name: '수호의 맹세',
            description: '아군 전체의 방어력을 25 증가시킵니다 (6초간)',
            effect: 'ally_defense_buff',
            value: 25,
            duration: 6
        },
        icon: '🛡️'
    },
    'elf_marksman': {
        id: 'elf_marksman',
        name: '엘프 명사수',
        cost: 2,
        weapon: 'bow',
        race: 'elf',
        stats: {
            hp: 480,
            attack: 65,
            attackSpeed: 0.9,
            range: 4,
            defense: 15,
            mana: 0,
            maxMana: 80,
            moveSpeed: 1.0
        },
        skill: {
            name: '관통 화살',
            description: '방어력을 무시하고 200 피해를 입힙니다',
            effect: 'true_damage',
            value: 200
        },
        icon: '🎯'
    },
    'kiki_assassin': {
        id: 'kiki_assassin',
        name: '키키 암살자',
        cost: 2,
        weapon: 'twin_blades',
        race: 'kiki',
        stats: {
            hp: 450,
            attack: 70,
            attackSpeed: 1.1,
            range: 1,
            defense: 15,
            mana: 0,
            maxMana: 70,
            moveSpeed: 1.4
        },
        skill: {
            name: '그림자 도약',
            description: '후열의 적에게 순간이동하여 250% 피해를 입힙니다',
            effect: 'backstab',
            value: 250
        },
        icon: '🗡️'
    },
    'seraphim_fighter': {
        id: 'seraphim_fighter',
        name: '세라핌 투사',
        cost: 2,
        weapon: 'gauntlet',
        race: 'seraphim',
        stats: {
            hp: 750,
            attack: 55,
            attackSpeed: 0.65,
            range: 1,
            defense: 35,
            mana: 0,
            maxMana: 100,
            moveSpeed: 1.0
        },
        skill: {
            name: '분쇄의 일격',
            description: '적을 2초간 기절시키고 180 피해를 입힙니다',
            effect: 'stun',
            value: 180,
            duration: 2
        },
        icon: '👊'
    },

    // === 3코스트 유닛 (4종) ===
    'elf_sage': {
        id: 'elf_sage',
        name: '엘프 현자',
        cost: 3,
        weapon: 'staff',
        race: 'elf',
        stats: {
            hp: 520,
            attack: 80,
            attackSpeed: 0.5,
            range: 3,
            defense: 20,
            mana: 0,
            maxMana: 100,
            moveSpeed: 1.0
        },
        skill: {
            name: '정령의 분노',
            description: '모든 적에게 마법 피해 300을 입힙니다',
            effect: 'aoe_magic_damage',
            value: 300
        },
        icon: '🧙‍♀️'
    },
    'velua_queen': {
        id: 'velua_queen',
        name: '벨루아 여왕',
        cost: 3,
        weapon: 'twin_blades',
        race: 'velua',
        stats: {
            hp: 550,
            attack: 85,
            attackSpeed: 1.15,
            range: 1,
            defense: 20,
            mana: 0,
            maxMana: 80,
            moveSpeed: 1.4
        },
        skill: {
            name: '치명적 유혹',
            description: '적에게 400 피해를 입히고 20% 확률로 즉사시킵니다',
            effect: 'execute',
            value: 400,
            executeChance: 20
        },
        icon: '👑'
    },
    'seraphim_guardian': {
        id: 'seraphim_guardian',
        name: '세라핌 수호자',
        cost: 3,
        weapon: 'greatsword',
        race: 'seraphim',
        stats: {
            hp: 1000,
            attack: 65,
            attackSpeed: 0.5,
            range: 1,
            defense: 60,
            mana: 0,
            maxMana: 120,
            moveSpeed: 0.8
        },
        skill: {
            name: '불멸의 의지',
            description: '처음 사망 시 체력 50%로 부활합니다',
            effect: 'resurrect',
            value: 50
        },
        icon: '⚡'
    },
    'general': {
        id: 'general',
        name: '대장군',
        cost: 3,
        weapon: 'gauntlet',
        race: 'male',
        stats: {
            hp: 850,
            attack: 75,
            attackSpeed: 0.6,
            range: 1,
            defense: 45,
            mana: 0,
            maxMana: 100,
            moveSpeed: 1.0
        },
        skill: {
            name: '전장의 함성',
            description: '아군 전체의 공격력 30%, 공격속도 20% 증가 (8초간)',
            effect: 'ally_buff',
            attackBuff: 30,
            attackSpeedBuff: 20,
            duration: 8
        },
        icon: '🎖️'
    }
};

// 유닛 ID 목록 (코스트별)
const UNITS_BY_COST = {
    1: ['kiki_guardian', 'kiki_sorcerer', 'velua_dancer', 'farmer', 'hunter', 'elf_apprentice'],
    2: ['velua_witch', 'swordswoman', 'knight', 'elf_marksman', 'kiki_assassin', 'seraphim_fighter'],
    3: ['elf_sage', 'velua_queen', 'seraphim_guardian', 'general']
};

// 종족별 이모지
const RACE_ICONS = {
    kiki: '🐱',
    velua: '💜',
    male: '♂️',
    female: '♀️',
    elf: '🧝',
    seraphim: '👼'
};

// 무기별 이모지
const WEAPON_ICONS = {
    greatsword: '🗡️',
    staff: '🪄',
    bow: '🏹',
    twin_blades: '⚔️',
    gauntlet: '🥊'
};

// 종족 이름 (한글)
const RACE_NAMES = {
    kiki: '키키',
    velua: '벨루아',
    male: '남자',
    female: '여자',
    elf: '엘프',
    seraphim: '세라핌'
};

// 무기 이름 (한글)
const WEAPON_NAMES = {
    greatsword: '대검',
    staff: '지팡이',
    bow: '활',
    twin_blades: '쌍검',
    gauntlet: '권갑'
};

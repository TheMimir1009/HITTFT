// 시너지 데이터 정의
const SYNERGIES_DATA = {
    // === 종족 시너지 (3종) ===
    kiki: {
        id: 'kiki',
        name: '키키',
        type: 'race',
        icon: '🐱',
        description: '작고 민첩한 종족. 회피와 이동에 특화',
        tiers: [
            {
                required: 2,
                effects: {
                    evasion: 20,
                    moveSpeed: 15
                },
                description: '회피율 +20%, 이동속도 +15%'
            },
            {
                required: 3,
                effects: {
                    evasion: 40,
                    moveSpeed: 30,
                    firstAttackDodge: true
                },
                description: '회피율 +40%, 이동속도 +30%, 첫 공격 회피'
            }
        ]
    },
    velua: {
        id: 'velua',
        name: '벨루아',
        type: 'race',
        icon: '💜',
        description: '매혹적인 힘을 지닌 종족. 적 약화와 흡수에 특화',
        tiers: [
            {
                required: 2,
                effects: {
                    lifesteal: 5,
                    enemyAttackReduction: 10
                },
                description: '흡혈 5%, 적 공격력 -10%'
            },
            {
                required: 3,
                effects: {
                    lifesteal: 12,
                    enemyAttackReduction: 20,
                    skillPower: 25
                },
                description: '흡혈 12%, 적 공격력 -20%, 스킬 위력 +25%'
            }
        ]
    },
    elf: {
        id: 'elf',
        name: '엘프',
        type: 'race',
        icon: '🧝',
        description: '자연과 교감하는 종족. 마나와 마법에 특화',
        tiers: [
            {
                required: 2,
                effects: {
                    manaRegen: 30,
                    skillPower: 15
                },
                description: '마나 회복 +30%, 스킬 위력 +15%'
            },
            {
                required: 3,
                effects: {
                    manaRegen: 50,
                    skillPower: 35,
                    startingMana: 30
                },
                description: '마나 회복 +50%, 스킬 위력 +35%, 시작 마나 +30'
            }
        ]
    },

    // === 무기 시너지 (5종) ===
    greatsword: {
        id: 'greatsword',
        name: '대검',
        type: 'weapon',
        icon: '🗡️',
        description: '탱커와 전사의 상징. 방어와 체력에 특화',
        tiers: [
            {
                required: 2,
                effects: {
                    defense: 25,
                    hp: 150
                },
                description: '방어력 +25, 체력 +150'
            },
            {
                required: 3,
                effects: {
                    defense: 50,
                    hp: 350,
                    damageReduction: 10
                },
                description: '방어력 +50, 체력 +350, 피해 감소 +10%'
            }
        ]
    },
    staff: {
        id: 'staff',
        name: '지팡이',
        type: 'weapon',
        icon: '🪄',
        description: '마법의 도구. 스킬과 광역 피해에 특화',
        tiers: [
            {
                required: 2,
                effects: {
                    skillPower: 30
                },
                description: '스킬 위력 +30%'
            },
            {
                required: 3,
                effects: {
                    skillPower: 55,
                    splashDamage: 20
                },
                description: '스킬 위력 +55%, 스킬 튀는 피해 20%'
            },
            {
                required: 4,
                effects: {
                    skillPower: 55,
                    splashDamage: 20,
                    allySkillPower: 25,
                    skillCooldownReduction: 20
                },
                description: '아군 스킬 위력 +25%, 스킬 쿨다운 -20%'
            }
        ]
    },
    bow: {
        id: 'bow',
        name: '활',
        type: 'weapon',
        icon: '🏹',
        description: '원거리 사격의 달인. 지속 피해와 사거리에 특화',
        tiers: [
            {
                required: 2,
                effects: {
                    attackSpeed: 25,
                    range: 1
                },
                description: '공격속도 +25%, 사거리 +1'
            }
        ]
    },
    twin_blades: {
        id: 'twin_blades',
        name: '쌍검',
        type: 'weapon',
        icon: '⚔️',
        description: '암살자의 무기. 치명타와 속도에 특화',
        tiers: [
            {
                required: 2,
                effects: {
                    critChance: 25,
                    critDamage: 30
                },
                description: '치명타 확률 +25%, 치명타 피해 +30%'
            },
            {
                required: 3,
                effects: {
                    critChance: 45,
                    critDamage: 60,
                    killAttackSpeedBonus: 20
                },
                description: '치명타 확률 +45%, 치명타 피해 +60%, 처치 시 공속 +20%'
            }
        ]
    },
    gauntlet: {
        id: 'gauntlet',
        name: '권갑',
        type: 'weapon',
        icon: '🥊',
        description: '격투가의 상징. 밸런스와 지속력에 특화',
        tiers: [
            {
                required: 2,
                effects: {
                    lifestealOnHit: 8,
                    attack: 15
                },
                description: '공격 시 체력 8% 회복, 공격력 +15%'
            },
            {
                required: 3,
                effects: {
                    lifestealOnHit: 15,
                    attack: 30,
                    damageReduction: 15
                },
                description: '공격 시 체력 15% 회복, 공격력 +30%, 피해 감소 +15%'
            }
        ]
    }
};

// 시너지 타입별 목록
const SYNERGIES_BY_TYPE = {
    race: ['kiki', 'velua', 'elf'],
    weapon: ['greatsword', 'staff', 'bow', 'twin_blades', 'gauntlet']
};

// 모든 시너지 ID 목록
const ALL_SYNERGY_IDS = [...SYNERGIES_BY_TYPE.race, ...SYNERGIES_BY_TYPE.weapon];

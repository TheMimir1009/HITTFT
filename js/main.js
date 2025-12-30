// 게임 시작점

document.addEventListener('DOMContentLoaded', async () => {
    // 디버그 콘솔 초기화
    debugConsole.init();

    // 게임 인스턴스 생성 및 초기화
    game = new GameController();
    await game.init();

    console.log('=================================');
    console.log('🎮 판타지 오토배틀러');
    console.log('=================================');
    console.log('조작법:');
    console.log('- 상점에서 유닛 클릭: 구매');
    console.log('- 유닛 드래그: 배치/이동');
    console.log('- 유닛 더블클릭: 판매');
    console.log('- 유닛 호버: 정보 확인');
    console.log('- F9 또는 ` 키: 디버그 콘솔');
    console.log('=================================');
});

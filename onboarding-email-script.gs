/**
 * 셀리맥스 온보딩 링크 자동 발송 스크립트
 *
 * [사전 준비]
 * 1. 구글시트에 아래 컬럼 추가 (열 번호는 아래 설정에서 변경 가능):
 *    - 개인 이메일: 입사자 개인 이메일 주소
 *    - 온보딩 링크: HR 대시보드 "🔗 링크 복사" 버튼으로 복사한 링크
 *
 * 2. 이 스크립트를 구글시트에 붙여넣기:
 *    구글시트 → 확장 프로그램 → Apps Script → 붙여넣기 → 저장
 *
 * 3. 트리거 설정 (1회만):
 *    Apps Script 편집기 → 왼쪽 ⏰ 트리거 → 트리거 추가
 *    - 실행할 함수: sendOnboardingLinks
 *    - 이벤트 소스: 시간 기반
 *    - 시간 기반 트리거 유형: 매일
 *    - 시간대: 한국 표준시
 *    - 시간: 오전 9시 ~ 10시
 */

// ===== 설정 (시트 구조에 맞게 수정) =====
const CONFIG = {
  sheetName: "[HR] 구성원 체크리스트 (입퇴사, 승진)", // 시트 이름
  headerRow: 2,        // 헤더 행 번호 (데이터는 그 다음 행부터)
  columns: {
    name: 2,           // C열 (0부터 시작하므로 index 2): 성함
    joinDate: 4,       // E열 (index 4): 입사일
    personalEmail: 6,  // G열 (index 6): 개인 이메일 ← 새로 추가할 컬럼
    onboardingLink: 7, // H열 (index 7): 온보딩 링크 ← 새로 추가할 컬럼
  },
  senderName: "셀리맥스 HR팀",
};
// ==========================================

function sendOnboardingLinks() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.sheetName);
  if (!sheet) {
    Logger.log("시트를 찾을 수 없어요: " + CONFIG.sheetName);
    return;
  }

  const data = sheet.getDataRange().getValues();
  const today = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd");
  let sentCount = 0;

  for (let i = CONFIG.headerRow; i < data.length; i++) {
    const row = data[i];
    const joinDateRaw = row[CONFIG.columns.joinDate];
    if (!joinDateRaw) continue;

    let joinDate;
    try {
      joinDate = Utilities.formatDate(new Date(joinDateRaw), "Asia/Seoul", "yyyy-MM-dd");
    } catch (e) {
      continue;
    }

    if (joinDate !== today) continue;

    const name = row[CONFIG.columns.name] || "입사자";
    const email = row[CONFIG.columns.personalEmail];
    const link = row[CONFIG.columns.onboardingLink];

    if (!email) {
      Logger.log(`[건너뜀] ${name}: 이메일 없음`);
      continue;
    }
    if (!link) {
      Logger.log(`[건너뜀] ${name}: 온보딩 링크 없음`);
      continue;
    }

    const subject = `[셀리맥스] ${name}님, 오늘 온보딩 페이지를 확인해주세요 🎉`;
    const body = `안녕하세요, ${name}님!

셀리맥스 입사를 진심으로 환영합니다 🎉

오늘 첫날 온보딩 체크리스트 페이지를 아래 링크에서 확인하실 수 있어요.

👉 ${link}

체크리스트를 하나씩 진행하다 보면 오늘 해야 할 일을 쉽게 파악하실 수 있을 거예요.
궁금한 점이 생기면 언제든 HR 담당자에게 편하게 말씀해주세요!

셀리맥스와 함께하게 되어 정말 반가워요 😊

${CONFIG.senderName} 드림`;

    try {
      GmailApp.sendEmail(email, subject, body);
      Logger.log(`[발송 완료] ${name} → ${email}`);
      sentCount++;
    } catch (e) {
      Logger.log(`[발송 실패] ${name}: ${e.message}`);
    }
  }

  Logger.log(`완료: 총 ${sentCount}명 발송`);
}

/**
 * 테스트용: 특정 이메일로 샘플 발송
 * 실제 트리거 설정 전에 아래 함수를 실행해서 이메일이 잘 오는지 확인하세요.
 */
function testSendEmail() {
  const testEmail = "여기에_본인_이메일_입력@gmail.com"; // ← 테스트 이메일 주소 변경
  const subject = "[테스트] 셀리맥스 온보딩 이메일 미리보기";
  const body = `안녕하세요, 홍길동님!

셀리맥스 입사를 진심으로 환영합니다 🎉

오늘 첫날 온보딩 체크리스트 페이지를 아래 링크에서 확인하실 수 있어요.

👉 https://onboarding-dashboard-six.vercel.app/person/테스트ID

체크리스트를 하나씩 진행하다 보면 오늘 해야 할 일을 쉽게 파악하실 수 있을 거예요.

${CONFIG.senderName} 드림`;

  GmailApp.sendEmail(testEmail, subject, body);
  Logger.log("테스트 이메일 발송 완료: " + testEmail);
}

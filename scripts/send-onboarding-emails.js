const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const APP_URL = 'https://onboarding-dashboard-six.vercel.app';

async function getTodayNewHires() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const url = `${SUPABASE_URL}/rest/v1/people?join_date=eq.${today}&google_account=not.is.null&select=id,name,google_account`;

  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  });

  if (!res.ok) throw new Error(`Supabase 조회 실패: ${await res.text()}`);
  return await res.json();
}

async function sendEmail(person) {
  const link = `${APP_URL}/person/${person.id}`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'onboarding@resend.dev',
      to: person.google_account,
      subject: `[셀리맥스] ${person.name}님, 온보딩 체크리스트를 확인해주세요!`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
          <h2 style="color:#0f172a;margin-bottom:8px;">안녕하세요, ${person.name}님! 👋</h2>
          <p style="color:#475569;line-height:1.7;margin-bottom:24px;">
            셀리맥스에 오신 것을 진심으로 환영합니다 🎉<br/>
            아래 버튼을 눌러 첫날 온보딩 체크리스트를 확인해주세요.
          </p>
          <a href="${link}"
            style="display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-size:15px;">
            온보딩 체크리스트 보기 →
          </a>
          <p style="color:#94a3b8;font-size:12px;margin-top:32px;">
            셀리맥스 HR팀
          </p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(JSON.stringify(err));
  }
}

async function main() {
  console.log('오늘 입사자 조회 중...');
  const people = await getTodayNewHires();

  if (!people || people.length === 0) {
    console.log('오늘 입사자 없음. 종료.');
    return;
  }

  console.log(`오늘 입사자 ${people.length}명 발견. 이메일 발송 시작.`);

  for (const person of people) {
    try {
      await sendEmail(person);
      console.log(`✅ 발송 완료: ${person.name} (${person.google_account})`);
    } catch (err) {
      console.error(`❌ 발송 실패: ${person.name}`, err.message);
    }
  }
}

main().catch((err) => {
  console.error('오류 발생:', err);
  process.exit(1);
});

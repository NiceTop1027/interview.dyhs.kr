import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required for Prisma seed scripts')
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
})

async function main() {
  console.log('Seeding database...')

  // 관리자 계정 생성
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@nicetop.ai'
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123!'
  const hashedPassword = await bcrypt.hash(adminPassword, 12)

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: '관리자',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log(`Admin user created: ${admin.email}`)

  // 샘플 문제은행 생성
  const questionBank = await prisma.questionBank.create({
    data: {
      name: '기본 문제은행',
      description: '샘플 문항들이 포함된 기본 문제은행입니다.',
      category: '일반',
    },
  })

  console.log(`Question bank created: ${questionBank.name}`)

  // 샘플 문항 생성
  const questions = await Promise.all([
    prisma.question.create({
      data: {
        type: 'MULTIPLE_CHOICE',
        content: '<p>다음 중 JavaScript의 데이터 타입이 아닌 것은?</p>',
        explanation: 'JavaScript의 기본 데이터 타입에는 string, number, boolean, undefined, null, symbol, bigint가 있습니다.',
        points: 10,
        options: [
          { id: '1', content: 'string', isCorrect: false },
          { id: '2', content: 'number', isCorrect: false },
          { id: '3', content: 'integer', isCorrect: true },
          { id: '4', content: 'boolean', isCorrect: false },
        ],
        difficulty: 1,
        tags: ['JavaScript', '기초'],
        questionBankId: questionBank.id,
        createdById: admin.id,
      },
    }),
    prisma.question.create({
      data: {
        type: 'MULTIPLE_CHOICE',
        content: '<p>React에서 컴포넌트의 상태를 관리하기 위해 사용하는 훅은?</p>',
        explanation: 'useState는 함수형 컴포넌트에서 상태를 관리하기 위한 React Hook입니다.',
        points: 10,
        options: [
          { id: '1', content: 'useEffect', isCorrect: false },
          { id: '2', content: 'useState', isCorrect: true },
          { id: '3', content: 'useContext', isCorrect: false },
          { id: '4', content: 'useRef', isCorrect: false },
        ],
        difficulty: 1,
        tags: ['React', '기초'],
        questionBankId: questionBank.id,
        createdById: admin.id,
      },
    }),
    prisma.question.create({
      data: {
        type: 'SHORT_ANSWER',
        content: '<p>HTTP 상태 코드 200의 의미를 간단히 설명하세요.</p>',
        explanation: 'HTTP 200 OK는 요청이 성공적으로 처리되었음을 나타냅니다.',
        points: 15,
        correctAnswer: '성공',
        answerKeywords: ['성공', 'OK', '정상', '완료'],
        difficulty: 1,
        tags: ['HTTP', '웹'],
        questionBankId: questionBank.id,
        createdById: admin.id,
      },
    }),
    prisma.question.create({
      data: {
        type: 'ESSAY',
        content: '<p>REST API의 주요 원칙에 대해 설명하세요.</p>',
        explanation: 'REST API는 Stateless, Client-Server, Cacheable, Uniform Interface 등의 원칙을 따릅니다.',
        points: 30,
        useAiGrading: true,
        gradingPrompt: '다음 키워드가 포함되어 있는지 확인: Stateless, Client-Server, Uniform Interface, 리소스 기반',
        difficulty: 3,
        tags: ['REST', 'API', '설계'],
        questionBankId: questionBank.id,
        createdById: admin.id,
      },
    }),
  ])

  console.log(`${questions.length} sample questions created`)

  // 샘플 시험 생성
  const exam = await prisma.exam.create({
    data: {
      title: '샘플 개발자 역량 테스트',
      description: '기본적인 웹 개발 지식을 평가하는 샘플 테스트입니다.',
      type: 'EXAM',
      status: 'DRAFT',
      duration: 30,
      enableCamera: true,
      enableMicrophone: true,
      enableCheatingDetection: true,
      randomizeQuestions: true,
      randomizeOptions: true,
      preventCopyPaste: true,
      showResultImmediately: true,
      passingScore: 60,
      createdById: admin.id,
    },
  })

  // 문항을 시험에 추가
  await Promise.all(
    questions.map((q, index) =>
      prisma.examQuestion.create({
        data: {
          examId: exam.id,
          questionId: q.id,
          order: index,
        },
      })
    )
  )

  // 초대 코드 생성
  const inviteCode = await prisma.inviteCode.create({
    data: {
      code: 'TEST1234',
      examId: exam.id,
      maxUses: 100,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일 후
      createdById: admin.id,
    },
  })

  console.log(`Sample exam created: ${exam.title}`)
  console.log(`Invite code: ${inviteCode.code}`)

  // AI 면접 샘플 생성
  const interview = await prisma.exam.create({
    data: {
      title: '샘플 AI 면접',
      description: 'AI 면접관과 진행하는 샘플 기술 면접입니다.',
      type: 'INTERVIEW',
      status: 'DRAFT',
      duration: 30,
      aiInterviewerName: 'AI 면접관',
      aiInterviewerPrompt: `당신은 친절하고 전문적인 기술 면접관입니다.
웹 개발 역량을 평가하기 위한 면접을 진행합니다.
다음 순서로 면접을 진행하세요:
1. 간단한 자기소개 요청
2. 프로젝트 경험에 대한 질문
3. 기술적인 문제 해결 능력 평가
4. 마무리 질문

각 답변에 대해 적절한 피드백과 후속 질문을 해주세요.`,
      maxQuestions: 10,
      enableCamera: true,
      enableMicrophone: true,
      enableCheatingDetection: true,
      createdById: admin.id,
    },
  })

  const interviewCode = await prisma.inviteCode.create({
    data: {
      code: 'INTERVIEW',
      examId: interview.id,
      maxUses: 100,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdById: admin.id,
    },
  })

  console.log(`Sample interview created: ${interview.title}`)
  console.log(`Interview invite code: ${interviewCode.code}`)

  console.log('Database seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { APP_SECRET, getUserId } = require('../utils')

async function signup(parent, args, context, info) {
  // 로그인 돌연변이의 경우, 가장 먼저 해야 할 일은 곧 설치할 bcryptjs 라이브러리를 사용하여 사용자의 암호를 암호화하는 것이다.
  const password = await bcrypt.hash(args.password, 10)
  // 다음 단계는 새 사용자를 데이터베이스에 저장하기 위해 Prisma 클라이언트 인스턴스를 사용하는 것이다. 
  const user = await context.prisma.createUser({ ...args, password })

  // 그런 다음 APP_SECRET로 서명된 JWT를 생성하게 된다. 이 APP_SECRET를 생성하고 여기에 사용되는 jwt 라이브러리를 설치해야 한다.
  const token = jwt.sign({ userId: user.id }, APP_SECRET)

  // 마지막으로, GraphQL 스키마에서 AuthPayload 개체의 모양을 준수하는 개체의 토큰과 사용자를 반환한다.
  return {
    token,
    user,
  }
}

async function login(parent, args, context, info) {
  // 새 사용자 개체를 생성하는 대신, 이제 프리즘 클라이언트 인스턴스를 사용하여 로그인 돌연변이의 인수로 함께 전송된 
  // 이메일 주소로 기존 사용자 레코드를 검색하고 있는 경우 해당 전자 메일 주소를 가진 사용자를 찾을 수 없는 경우, 
  // 해당 오류를 반환하는 것이다.
  const user = await context.prisma.user({ email: args.email })
  if (!user) {
    throw new Error('No such user found')
  }

  // 다음 단계는 제공된 암호를 데이터베이스에 저장된 암호와 비교하는 것이다. 만약 그 둘이 일치하지 않는다면, 당신도 오류를 반환하는 것이다.
  const valid = await bcrypt.compare(args.password, user.password)
  if (!valid) {
    throw new Error('Invalid password')
  }

  const token = jwt.sign({ userId: user.id }, APP_SECRET)

  // 결국 토큰과 사용자를 다시 반환하는 겁니다.
  return {
    token,
    user,
  }
}

function post(parent, args, context, info) {
  const userId = getUserId(context)
  return context.prisma.createLink({
    url: args.url,
    description: args.description,
    postedBy: { connect: { id: userId } },
  })
}

async function vote(parent, args, context, info) {
  // 사후 해결기에서 수행하는 것과 마찬가지로 첫 번째 단계는 getUserId 도우미 기능을 사용하여 들어오는 JWT를 검증하는 것이다. 유효하다면, 기능은 요청을 하는 사용자의 userId를 반환할 것이다. JWT가 유효하지 않은 경우, 기능은 예외를 던진다.
  const userId = getUserId(context)

  // Prisma.$exists.vote(...) 함수 호출은 당신에게 새로운 것이다. Prisma 클라이언트 인스턴스는 당신의 모델에 대한 CRUD 방법을 노출할 뿐만 아니라 모델당 하나의 $exist 함수를 생성한다. $exists 함수는 해당 유형의 요소에 대한 특정 조건을 지정할 수 있는 필터 객체를 취한다. 조건이 데이터베이스의 하나 이상의 요소에 적용되는 경우에만 $exists 함수는 true로 돌아온다. 이 경우 args.linkId로 식별된 링크에 대해 요청 사용자가 아직 투표하지 않았는지 확인하기 위해 이 링크를 사용하십시오.
  const linkExists = await context.prisma.$exists.vote({
    user: { id: userId },
    link: { id: args.linkId },
  })
  if (linkExists) {
    throw new Error(`Already voted for link: ${args.linkId}`)
  }

  // 존재하는 경우 false가 반환되면 createVote 메서드를 사용하여 사용자 및 링크에 연결된 새 투표를 생성한다.
  return context.prisma.createVote({
    user: { connect: { id: userId } },
    link: { connect: { id: args.linkId } },
  })
}

module.exports = {
  signup,
  login,
  post,
  vote,
}

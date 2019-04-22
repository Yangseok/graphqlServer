// feed 타입에 맞게 데이터를 입력
function feed (root, args, context, info) {
  return context.prisma.links()
}

module.exports = {
  feed,
}
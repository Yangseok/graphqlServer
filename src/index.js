const { GraphQLServer } = require('graphql-yoga')
const { prisma } = require('./generated/prisma-client')

//GraphQL 스키마 실제 구현
const resolvers = {
  Query: {
    info: () => `This is the API of a Hackernews Clone`,
    // feed 타입에 맞게 데이터를 입력
    feed: (root, args, context, info) => {
      return context.prisma.links()
    },
  },
  Mutation: {
    post: (root, args, context) => {
      return context.prisma.createLink({
        url: args.url,
        description: args.description,
      })
    },
  },
  // Link 스키마에 정의된 유형에 대해 추가
  Link: {
    id: (parent) => parent.id,
    description: (parent) => parent.description,
    url: (parent) => parent.url,
  }
}

//스키마와 리졸버를 GraphQL 서버로 전달. 서버에 허용되는 API 작업과 해결 방법을 서버에 알려줌.
const server = new GraphQLServer({
  typeDefs: './src/schema.graphql',
  resolvers,
  context: { prisma },
})

server.start(() => console.log(`Server is running on http://localhost:4000`))